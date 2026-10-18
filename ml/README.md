# Mudra recognition pipeline

Trains the classifiers behind the Recognize page. Hand pose is detected with
Google's pretrained MediaPipe HandLandmarker (no training needed for that
part); a small MLP, trained here, classifies the normalized landmarks into a
mudra.

## Setup

```bash
cd mudra-app
python3 -m venv ml/venv
source ml/venv/bin/activate
pip install mediapipe tensorflow scikit-learn pillow numpy
```

If `import tensorflow` or `import mediapipe` crashes with `mutex lock failed:
Invalid argument` on macOS, it's an ABI conflict between TensorFlow's bundled
Abseil/C++ runtime and `pyarrow` (pulled in by `pandas`). Make sure this venv
has neither `pandas` nor `pyarrow` installed — they aren't needed here.

## Run

```bash
# 1. Extract hand-landmark features from the dataset
python ml/extract_landmarks.py        # update the ZIP path at the top first
python ml/extract_double_landmarks.py # re-pass for double-hand classes with a
                                       # looser detection threshold — overlapping
                                       # hands are easy to miss at the default 0.5

# 2. Train both classifiers
python ml/train_classifier.py single
python ml/train_classifier.py double

# 3. Export weights as JSON for the browser
python ml/export_weights.py single
python ml/export_weights.py double
```

`ml/data/` (landmark `.npz` files, trained `.keras` models) is gitignored —
only the exported `public/models/*.json` and the downloaded
`public/models/hand_landmarker.task` are committed, since that's all the app
needs at runtime.

## Feature representation

21 landmarks x (x, y, z), translated so the wrist is the origin and scaled by
the wrist-to-middle-finger-MCP distance (landmark 9) — this makes it roughly
invariant to hand position/size in frame. Single-hand mudras get one 63-dim
vector; double-hand mudras get two such vectors concatenated (126-dim),
ordered left-hand-first by x position.
