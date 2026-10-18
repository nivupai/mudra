"""
Extract normalized hand-landmark feature vectors from the Bharatanatyam Mudra
Dataset, for training a mudra classifier.

Run from the mudra-app/ directory with the ml/ venv active:
    python3 -m venv ml/venv && source ml/venv/bin/activate
    pip install mediapipe tensorflow scikit-learn
    python ml/extract_landmarks.py

Single-hand mudras -> one 63-dim feature vector (21 landmarks x xyz),
normalized relative to the wrist and a scale reference.
Double-hand mudras -> two such vectors concatenated (126-dim), ordered
left-hand-first by x position in the image.

Images where MediaPipe doesn't detect the expected number of hands are
skipped (bad crop, occlusion, etc).
"""
import io
import re
import zipfile

import mediapipe as mp
import numpy as np
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
from PIL import Image

ZIP = "~/Downloads/Bharatanatyam-Mudra-Dataset-master.zip"  # update to your copy
MODEL_PATH = "public/models/hand_landmarker.task"
OUT_DIR = "ml/data"
MAX_PER_CLASS = 140

DOUBLE_HAND_SLUGS = {
    "anjali", "kapotham", "karkatta", "swastikam", "pushpaputa", "shivalinga",
    "katakavardhana", "kartariswastika", "sakata", "shanka", "chakra",
    "samputa", "pasha", "kilaka", "matsya", "kurma", "varaha", "garuda",
    "nagabandha", "khatva", "berunda",
}


def slugify(folder):
    base = re.sub(r"\(\d+\)$", "", folder).strip()
    base = re.sub(r"[_\s]+", "-", base)
    return base.lower()


def landmarks_to_vec(hand_landmarks):
    pts = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks], dtype=np.float32)
    wrist = pts[0].copy()
    pts -= wrist
    scale = np.linalg.norm(pts[9][:2]) or 1.0  # wrist -> middle finger MCP
    pts /= scale
    return pts.flatten()


def main():
    import os

    os.makedirs(OUT_DIR, exist_ok=True)
    base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.HandLandmarkerOptions(base_options=base_options, num_hands=2)
    landmarker = vision.HandLandmarker.create_from_options(options)

    zf = zipfile.ZipFile(os.path.expanduser(ZIP))
    folders = {}
    for n in zf.namelist():
        parts = n.split("/")
        if len(parts) < 3 or not parts[2].lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        folders.setdefault(parts[1], []).append(n)

    single_X, single_y = [], []
    double_X, double_y = [], []

    for folder in sorted(folders):
        slug = slugify(folder)
        files = sorted(folders[folder])
        expect_two = slug in DOUBLE_HAND_SLUGS
        step = max(1, len(files) // MAX_PER_CLASS)
        picks = files[::step][:MAX_PER_CLASS]

        kept = 0
        for fn in picks:
            with zf.open(fn) as f:
                raw = f.read()
            pil_img = Image.open(io.BytesIO(raw)).convert("RGB")
            np_img = np.array(pil_img)
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=np_img)
            result = landmarker.detect(mp_img)
            hands = result.hand_landmarks

            if expect_two:
                if len(hands) != 2:
                    continue
                order = sorted(
                    range(2),
                    key=lambda i: np.mean([lm.x for lm in hands[i]]),
                )
                vec = np.concatenate(
                    [landmarks_to_vec(hands[order[0]]), landmarks_to_vec(hands[order[1]])]
                )
                double_X.append(vec)
                double_y.append(slug)
            else:
                if len(hands) != 1:
                    continue
                vec = landmarks_to_vec(hands[0])
                single_X.append(vec)
                single_y.append(slug)
            kept += 1

        print(f"{slug}: kept {kept}/{len(picks)} ({'double' if expect_two else 'single'})", flush=True)

    np.savez(
        f"{OUT_DIR}/single_hand_landmarks.npz",
        X=np.array(single_X, dtype=np.float32),
        y=np.array(single_y),
    )
    np.savez(
        f"{OUT_DIR}/double_hand_landmarks.npz",
        X=np.array(double_X, dtype=np.float32),
        y=np.array(double_y),
    )
    print("DONE", len(single_X), "single-hand samples,", len(double_X), "double-hand samples")


if __name__ == "__main__":
    main()
