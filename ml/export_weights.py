"""
Export a trained Keras MLP's weights to plain JSON so the browser can run
inference with a tiny hand-written forward pass (no TF.js runtime needed) —
see src/data/mudraClassifier.js for the matching JS forward pass.

Usage: python ml/export_weights.py single
       python ml/export_weights.py double
"""
import json
import sys

import tensorflow as tf

KIND = sys.argv[1]
model = tf.keras.models.load_model(f"ml/data/{KIND}_hand_model.keras")

with open(f"ml/data/{KIND}_hand_labels.json") as f:
    labels = json.load(f)

layers = []
for layer in model.layers:
    weights = layer.get_weights()
    if not weights:  # dropout etc.
        continue
    W, b = weights
    layers.append({
        "W": W.tolist(),
        "b": b.tolist(),
        "activation": layer.get_config().get("activation", "linear"),
    })

out = {"labels": labels, "layers": layers}
out_path = f"public/models/{KIND}_hand_model.json"
with open(out_path, "w") as f:
    json.dump(out, f)

print(f"Exported {KIND} model: {len(layers)} layers, {len(labels)} labels -> {out_path}")
