"""
Train a small MLP classifier on hand-landmark feature vectors.

Usage: python ml/train_classifier.py single
       python ml/train_classifier.py double
"""
import json
import sys

import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

KIND = sys.argv[1]  # "single" or "double"
assert KIND in ("single", "double")

data = np.load(f"ml/data/{KIND}_hand_landmarks.npz", allow_pickle=True)
X, y_raw = data["X"], data["y"]

le = LabelEncoder()
y = le.fit_transform(y_raw)
num_classes = len(le.classes_)
input_dim = X.shape[1]

X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.15, random_state=42, stratify=y
)

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(input_dim,)),
    tf.keras.layers.Dense(128, activation="relu"),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(64, activation="relu"),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(num_classes, activation="softmax"),
])
model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])

model.fit(
    X_train, y_train,
    validation_data=(X_val, y_val),
    epochs=60,
    batch_size=32,
    verbose=2,
    callbacks=[tf.keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True)],
)

val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
print(f"\n{KIND}-hand validation accuracy: {val_acc:.3f}")

model.save(f"ml/data/{KIND}_hand_model.keras")
with open(f"ml/data/{KIND}_hand_labels.json", "w") as f:
    json.dump(list(le.classes_), f)

print("Saved model and labels for", KIND)
