import cv2
import mediapipe as mp
import numpy as np
import pandas as pd
import torch

mp_holistic = mp.solutions.holistic

def load_label_list(words_csv):
    df = pd.read_csv(str(words_csv))
    labels = sorted(df["gloss"].astype(str).unique().tolist())
    return labels

def extract_landmarks_from_video(video_path, max_frames=None):
    cap = cv2.VideoCapture(str(video_path))
    seq = []

    with mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as holo:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            res = holo.process(img)
            vec = np.zeros(227, dtype=np.float32)

            if res.pose_landmarks:
                pts = res.pose_landmarks.landmark
                for i, lm in enumerate(pts[:33]):
                    vec[i * 3 + 0] = lm.x
                    vec[i * 3 + 1] = lm.y
                    vec[i * 3 + 2] = lm.z

            offset = 99
            if res.left_hand_landmarks:
                for i, lm in enumerate(res.left_hand_landmarks.landmark[:21]):
                    vec[offset + i * 3 + 0] = lm.x
                    vec[offset + i * 3 + 1] = lm.y
                    vec[offset + i * 3 + 2] = lm.z
                vec[99 + 21 * 3] = 1.0

            offset = 99 + 21 * 3 + 1
            if res.right_hand_landmarks:
                for i, lm in enumerate(res.right_hand_landmarks.landmark[:21]):
                    vec[offset + i * 3 + 0] = lm.x
                    vec[offset + i * 3 + 1] = lm.y
                    vec[offset + i * 3 + 2] = lm.z
                vec[offset + 21 * 3] = 1.0

            seq.append(vec)

            if max_frames and len(seq) >= max_frames:
                break

    cap.release()

    if len(seq) == 0:
        return np.zeros((0, 227), dtype=np.float32)

    return np.stack(seq, axis=0)

def extract_landmarks_from_image(img_rgb, holo=None):
    created = False
    if holo is None:
        holo = mp_holistic.Holistic(
            static_image_mode=True,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        created = True

    res = holo.process(img_rgb)
    vec = np.zeros(227, dtype=np.float32)

    if res is None:
        if created:
            holo.close()
        return vec

    if res.pose_landmarks:
        pts = res.pose_landmarks.landmark
        for i, lm in enumerate(pts[:33]):
            vec[i * 3 + 0] = lm.x
            vec[i * 3 + 1] = lm.y
            vec[i * 3 + 2] = lm.z

    offset = 99
    if res.left_hand_landmarks:
        for i, lm in enumerate(res.left_hand_landmarks.landmark[:21]):
            vec[offset + i * 3 + 0] = lm.x
            vec[offset + i * 3 + 1] = lm.y
            vec[offset + i * 3 + 2] = lm.z
        vec[99 + 21 * 3] = 1.0

    offset = 99 + 21 * 3 + 1
    if res.right_hand_landmarks:
        for i, lm in enumerate(res.right_hand_landmarks.landmark[:21]):
            vec[offset + i * 3 + 0] = lm.x
            vec[offset + i * 3 + 1] = lm.y
            vec[offset + i * 3 + 2] = lm.z
        vec[offset + 21 * 3] = 1.0

    if created:
        holo.close()

    return vec

def normalize_sequence(seq):
    if seq.shape[0] == 0:
        return seq

    coord_idx = np.r_[0:162, 163:226]
    coords = seq[:, coord_idx].reshape(seq.shape[0], -1, 3)
    xy = coords[..., :2]
    vis_mask = np.any(np.abs(xy) > 1e-6, axis=2)
    out_coords = coords.copy()

    for i in range(seq.shape[0]):
        mask = vis_mask[i]
        if not np.any(mask):
            continue
        pts = xy[i][mask]
        center = pts.mean(axis=0)
        scale = np.mean(np.linalg.norm(pts - center, axis=1)) + 1e-6
        out_coords[i, :, :2] = (out_coords[i, :, :2] - center) / scale

    out_seq = seq.copy()
    out_seq[:, coord_idx] = out_coords.reshape(seq.shape[0], -1)
    return out_seq

def temporal_sample(seq, T, augment=False):
    length = seq.shape[0]

    if length == 0:
        return np.zeros((T, seq.shape[1]), dtype=np.float32)

    if length > T:
        start = np.random.randint(0, length - T + 1) if augment else (length - T) // 2
        return seq[start : start + T]

    if length < T:
        pad = np.repeat(seq[-1:], T - length, axis=0)
        return np.concatenate([seq, pad], axis=0)

    return seq

def predict_sequence_batch(model, sequences, device):
    x = torch.from_numpy(np.stack(sequences)).to(device).float()

    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=-1).cpu().numpy()

    return probs
