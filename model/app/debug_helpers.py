import numpy as np
from collections import deque

from .config import T_SEQ
from .services.landmark_service import (
    extract_landmarks_from_video,
    normalize_sequence,
    temporal_sample,
    predict_sequence_batch,
)


def predict_video_with_smoothing_batch(
    model,
    video_path,
    stride=6,
    T=T_SEQ,
    alpha=0.6,
    apply_normalize=True,
    device=None,
):
    seq = extract_landmarks_from_video(video_path)

    if seq.shape[0] == 0:
        return "", 0, [], []

    if apply_normalize:
        seq = normalize_sequence(seq)

    window = deque(maxlen=T)
    for i in range(min(T, seq.shape[0])):
        window.append(seq[i])

    sequences = []
    frame_indices = []

    for frame_idx in range(seq.shape[0]):
        if frame_idx >= T:
            window.append(seq[frame_idx])

        if frame_idx % stride == 0:
            cur_seq = temporal_sample(np.array(window), T=T, augment=False)
            sequences.append(cur_seq)
            frame_indices.append(frame_idx)

    probs_all = predict_sequence_batch(model, sequences, device)

    ema_logits = None
    results = []

    for probs, frame_idx in zip(probs_all, frame_indices):
        if ema_logits is None:
            ema_logits = probs
        else:
            ema_logits = alpha * probs + (1 - alpha) * ema_logits

        pred_idx = int(ema_logits.argmax())
        pred_prob = float(ema_logits.max())
        results.append((pred_idx, pred_prob, frame_idx))

    filtered = [r for r in results if r[1] >= 0.5]

    if len(filtered) == 0:
        final_idx = int(ema_logits.argmax())
    else:
        counts = {}
        for idx, _, _ in filtered:
            counts[idx] = counts.get(idx, 0) + 1
        final_idx = max(counts.items(), key=lambda x: x[1])[0]

    if ema_logits is not None:
        k = min(5, ema_logits.shape[0])
        top_idxs = np.argpartition(ema_logits, -k)[-k:]
        top_idxs = top_idxs[np.argsort(ema_logits[top_idxs])[::-1]]
        top_probs = [float(ema_logits[i]) for i in top_idxs]
        top5 = list(zip(top_idxs.tolist(), top_probs))
    else:
        top5 = []

    return final_idx, seq.shape[0], results, top5
