"""
Re-extract double-hand landmark features with a more lenient detector, since
overlapping/occluded hands in double-hand mudras cause the default confidence
threshold to miss a lot of 2-hand detections. Pulls from a larger sample pool
per class to compensate for the lower hit rate. Run after extract_landmarks.py.
"""
import io
import os
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
TARGET_PER_CLASS = 120
MAX_ATTEMPTS = 500

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
    scale = np.linalg.norm(pts[9][:2]) or 1.0
    pts /= scale
    return pts.flatten()


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
    options = vision.HandLandmarkerOptions(
        base_options=base_options,
        num_hands=2,
        min_hand_detection_confidence=0.3,
        min_hand_presence_confidence=0.3,
    )
    landmarker = vision.HandLandmarker.create_from_options(options)

    zf = zipfile.ZipFile(os.path.expanduser(ZIP))
    folders = {}
    for n in zf.namelist():
        parts = n.split("/")
        if len(parts) < 3 or not parts[2].lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        if slugify(parts[1]) in DOUBLE_HAND_SLUGS:
            folders.setdefault(parts[1], []).append(n)

    double_X, double_y = [], []

    for folder in sorted(folders):
        slug = slugify(folder)
        files = sorted(folders[folder])
        attempts = files[:MAX_ATTEMPTS]

        kept = 0
        for fn in attempts:
            if kept >= TARGET_PER_CLASS:
                break
            with zf.open(fn) as f:
                raw = f.read()
            pil_img = Image.open(io.BytesIO(raw)).convert("RGB")
            np_img = np.array(pil_img)
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=np_img)
            result = landmarker.detect(mp_img)
            hands = result.hand_landmarks

            if len(hands) != 2:
                continue
            order = sorted(range(2), key=lambda i: np.mean([lm.x for lm in hands[i]]))
            vec = np.concatenate(
                [landmarks_to_vec(hands[order[0]]), landmarks_to_vec(hands[order[1]])]
            )
            double_X.append(vec)
            double_y.append(slug)
            kept += 1

        print(f"{slug}: kept {kept}/{len(attempts)} attempted", flush=True)

    np.savez(
        f"{OUT_DIR}/double_hand_landmarks.npz",
        X=np.array(double_X, dtype=np.float32),
        y=np.array(double_y),
    )
    print("DONE", len(double_X), "double-hand samples")


if __name__ == "__main__":
    main()
