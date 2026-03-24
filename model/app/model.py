import torch
import torch.nn as nn
import numpy as np
import math
from pathlib import Path
from collections import deque
from .config import MODEL_TYPE, GRU_CKPT, TRANSFORMER_CKPT, WORDS_CSV, T_SEQ
from .services.landmark_service import (
    load_label_list,
    extract_landmarks_from_video,
    extract_landmarks_from_image,
    normalize_sequence,
    temporal_sample,
    predict_sequence_batch,
    mp_holistic,
)
import cv2

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

LABELS = load_label_list(WORDS_CSV)
NUM_CLASSES = len(LABELS)
label2idx = {lbl: idx for idx, lbl in enumerate(LABELS)}
idx2label = {v: k for k, v in label2idx.items()}

class GRUModel(nn.Module):
    def __init__(self, in_dim, num_classes, hidden=256, num_layers=1, bidirectional=False, dropout=0.1):
        super().__init__()
        self.rnn = nn.GRU(input_size=in_dim, hidden_size=hidden, num_layers=num_layers,
                        batch_first=True, bidirectional=bidirectional, dropout=dropout if num_layers>1 else 0.0)
        self.fc = nn.Sequential(nn.LayerNorm(hidden * (2 if bidirectional else 1)),
                               nn.Linear(hidden * (2 if bidirectional else 1), num_classes))
    def forward(self, x):
        out, _ = self.rnn(x)
        out = out.mean(dim=1)
        out = self.fc(out)
        return out

class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=512):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len).unsqueeze(1).float()
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * -(math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe)

    def forward(self, x):
        return x + self.pe[:x.size(1), :]

class LandmarkTransformer(nn.Module):
    def __init__(self, in_dim: int, num_classes: int, d_model=128, nhead=4, nlayers=3, ffn=256, dropout=0.1):
        super().__init__()
        self.input_fc = nn.Linear(in_dim, d_model)
        self.pos = PositionalEncoding(d_model, max_len=512)
        encoder_layer = nn.TransformerEncoderLayer(d_model, nhead, dim_feedforward=ffn, dropout=dropout, activation='gelu', batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=nlayers)
        self.pool = nn.AdaptiveAvgPool1d(1)
        self.cls = nn.Sequential(nn.LayerNorm(d_model), nn.Linear(d_model, num_classes))

    def forward(self, x):
        x = self.input_fc(x)
        x = self.pos(x)
        x = x.permute(1,0,2) # T x B x D
        x = self.transformer(x)
        x = x.permute(1,2,0) # B x D x T
        x = self.pool(x).squeeze(-1) # B x D
        logits = self.cls(x)
        return logits

def init_model(in_dim, num_classes, model_type = 'gru'):
    if model_type == 'gru':
        model = GRUModel(in_dim=in_dim, num_classes=num_classes, hidden=256, num_layers=1, bidirectional=False, dropout=0.1)
    elif model_type == 'transformer':
        model = LandmarkTransformer(in_dim=in_dim, num_classes=num_classes, d_model=256, nhead=8, nlayers=4, ffn=512, dropout=0.2)
    else:
        raise ValueError('Unknown model type')
    return model

def load_model_and_checkpoint(model_type):
    model = init_model(in_dim=227, num_classes=NUM_CLASSES, model_type=model_type)
    model.to(DEVICE)
    print(f'Device using {DEVICE}...')
    if model_type == 'gru':
        ckpt_path = GRU_CKPT
    elif model_type == 'transformer':
        ckpt_path = TRANSFORMER_CKPT
    else:
        raise ValueError('Unknown model type')
    ckpt_path = Path(ckpt_path)
    if not ckpt_path.exists():
        raise FileNotFoundError(f'Checkpoint not found: {ckpt_path}')
    ck = torch.load(str(ckpt_path), map_location=DEVICE)
    # checkpoint may store state under different keys
    state = ck.get('model_state', ck.get('state_dict', ck))
    try:
        model.load_state_dict(state)
        print('Loaded checkpoint into model (exact match).')
    except Exception as e:
        print('Exact load failed — attempting safe partial load:', e)
        # handle common DataParallel 'module.' prefix
        normalized_state = {}
        for k, v in state.items():
            nk = k[len('module.'):] if k.startswith('module.') else k
            normalized_state[nk] = v
        state = normalized_state

        model_dict = model.state_dict()
        matched = {}
        mismatched = []
        unexpected = []
        for k, v in state.items():
            if k in model_dict:
                if v.shape == model_dict[k].shape:
                    # move to the device expected by the model parameter
                    matched[k] = v.to(model_dict[k].device)
                else:
                    mismatched.append((k, tuple(v.shape), tuple(model_dict[k].shape)))
            else:
                unexpected.append(k)

        if matched:
            # update model state with matched params and load
            model_dict.update(matched)
            try:
                model.load_state_dict(model_dict)
                print(f'Partially loaded checkpoint: {len(matched)} tensors     matched.')
            except Exception as e2:
                print('Partial load failed:', e2)
        else:
            print('No matching parameters found between checkpoint and model; skipping parameter load.')

        if mismatched:
            print(f'Skipped {len(mismatched)} parameter(s) with size mismatch. Showing up to 10:')
            for k, s_ck, s_mod in mismatched[:10]:
                print(f'  {k}: ckpt {s_ck} vs model {s_mod}')
        if unexpected:
            print(f'Skipped {len(unexpected)} unexpected checkpoint key(s).')

    model.eval()
    return model


def predict_sequence(model, seq_np, device=DEVICE, apply_normalize=True):
    if apply_normalize:
        seq_np = normalize_sequence(seq_np)
    seq_in = temporal_sample(seq_np, T=T_SEQ, augment=False)
    x = torch.from_numpy(seq_in).unsqueeze(0).to(device).float()
    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=-1).cpu().numpy().squeeze()
    return probs

def predict_video_with_smoothing(model, video_path, stride=4, T=T_SEQ, alpha=0.8, apply_normalize=True):
    seq = extract_landmarks_from_video(video_path)
    if seq.shape[0] == 0:
        return '', 0, [], []
    window = deque(maxlen=T)
    for i in range(min(T, seq.shape[0])): window.append(seq[i])
    ema_logits = None
    results = []
    frame_idx = 0
    while frame_idx < seq.shape[0]:
        if frame_idx >= T:
            window.append(seq[frame_idx])
        if frame_idx % stride == 0:
            cur_seq = np.array(window)
            probs = predict_sequence(model, cur_seq, device=DEVICE, apply_normalize=apply_normalize)
            if ema_logits is None:
                ema_logits = probs
            else:
                ema_logits = alpha * probs + (1-alpha) * ema_logits
            pred_idx = int(ema_logits.argmax())
            pred_prob = float(ema_logits.max())
            results.append((pred_idx, pred_prob, frame_idx))
        frame_idx += 1
    filtered = [r for r in results if r[1] >= 0.5]
    if len(filtered) == 0:
        final_idx = int(ema_logits.argmax())
    else:
        final_idx = int(ema_logits.argmax())
        
    final_label = idx2label[final_idx]

    # compute top-5 from the final EMA logits (if available)
    if ema_logits is not None:
        k = min(5, ema_logits.shape[0])
        top_idxs = np.argpartition(ema_logits, -k)[-k:]
        top_idxs = top_idxs[np.argsort(ema_logits[top_idxs])[::-1]]
        top_probs = [float(ema_logits[i]) for i in top_idxs]
        top_labels = [idx2label[int(i)] for i in top_idxs]
        top5 = list(zip(top_labels, top_probs))
    else:
        top5 = []

    return final_label, seq.shape[0], results, top5


class RealtimePredictor:
    """A lightweight realtime predictor that accepts frames (BGR numpy arrays)
    and produces predictions at the configured stride.

    Usage:
        pred = RealtimePredictor(model)
        result = pred.add_frame(bgr_frame)
        if result is not None:
            # use result['top5'], result['label'], result['prob']
    """
    def __init__(self, model, device=DEVICE, T=T_SEQ, stride=4, alpha=0.8, apply_normalize=True, model_complexity=1, vote_window=5):
        self.model = model
        self.device = device
        self.T = T
        self.stride = stride
        self.alpha = alpha
        self.apply_normalize = apply_normalize
        self.window = deque(maxlen=self.T)
        self.ema_logits = None
        self.pred_history = deque(maxlen=max(1, int(vote_window)))
        self.frame_idx = 0
        # create a reusable MediaPipe Holistic instance for per-frame processing
        self.holo = mp_holistic.Holistic(static_image_mode=False, model_complexity=model_complexity, min_detection_confidence=0.5, min_tracking_confidence=0.7)

    def add_frame(self, bgr_frame):
        """Process a single BGR frame.

        Returns a dict with keys `label`, `prob`, `top5`, `frame_idx` when a prediction
        is produced (i.e., on frames matching the stride). Returns None otherwise.
        """
        # convert to RGB and extract landmark vector
        img_rgb = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
        vec = extract_landmarks_from_image(img_rgb, holo=self.holo)

        self.window.append(vec)

        result = None
        # warm up until we have a full temporal window for more stable predictions
        if len(self.window) < self.T:
            self.frame_idx += 1
            return None

        if (self.frame_idx % self.stride) == 0:
            cur_seq = np.array(self.window)
            probs = predict_sequence(self.model, cur_seq, device=self.device, apply_normalize=self.apply_normalize)
            if self.ema_logits is None:
                self.ema_logits = probs
            else:
                self.ema_logits = self.alpha * probs + (1 - self.alpha) * self.ema_logits

            raw_pred_idx = int(self.ema_logits.argmax())
            self.pred_history.append(raw_pred_idx)

            # short majority vote over recent predictions to reduce frame-level jitter
            vote_counts = {}
            for idx in self.pred_history:
                vote_counts[idx] = vote_counts.get(idx, 0) + 1
            pred_idx = max(vote_counts.items(), key=lambda item: item[1])[0]
            pred_prob = float(self.ema_logits[pred_idx])

            # Top 5
            k = min(5, self.ema_logits.shape[0])
            top_idxs = np.argpartition(self.ema_logits, -k)[-k:]
            top_idxs = top_idxs[np.argsort(self.ema_logits[top_idxs])[::-1]]
            top_probs = [float(self.ema_logits[i]) for i in top_idxs]
            top_labels = [idx2label[int(i)] for i in top_idxs]
            top5 = list(zip(top_labels, top_probs))

            result = {
                'label': idx2label[pred_idx],
                'prob': pred_prob,
                'top5': top5,
                'frame_idx': self.frame_idx,
            }

        self.frame_idx += 1
        return result

    def close(self):
        try:
            self.holo.close()
        except Exception:
            pass