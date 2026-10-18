// Loads the exported single/double-hand MLP weights and runs inference
// directly in JS — no TF.js runtime needed, this mirrors scripts/train_classifier.py
// and scripts/export_weights.py in the repo root.

function relu(v) {
  return v.map((x) => Math.max(0, x));
}

function softmax(v) {
  const max = Math.max(...v);
  const exps = v.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / sum);
}

// y = xW + b, where W is [inputDim][outputDim]
function dense(x, W, b) {
  const out = new Array(b.length).fill(0);
  for (let j = 0; j < b.length; j++) {
    let sum = b[j];
    for (let i = 0; i < x.length; i++) sum += x[i] * W[i][j];
    out[j] = sum;
  }
  return out;
}

function forward(x, layers) {
  let v = x;
  for (const layer of layers) {
    v = dense(v, layer.W, layer.b);
    if (layer.activation === "relu") v = relu(v);
    else if (layer.activation === "softmax") v = softmax(v);
  }
  return v;
}

export async function loadModel(kind, baseUrl) {
  const res = await fetch(`${baseUrl}models/${kind}_hand_model.json`);
  return res.json();
}

export function predict(model, featureVector) {
  const probs = forward(featureVector, model.layers);
  const ranked = model.labels
    .map((label, i) => ({ label, prob: probs[i] }))
    .sort((a, b) => b.prob - a.prob);
  return ranked;
}

// landmarks: array of 21 {x,y,z} from MediaPipe HandLandmarker (normalized image coords)
export function landmarksToVec(landmarks) {
  const wrist = landmarks[0];
  const pts = landmarks.map((p) => [p.x - wrist.x, p.y - wrist.y, p.z - wrist.z]);
  const mcp = pts[9];
  const scale = Math.hypot(mcp[0], mcp[1]) || 1;
  const out = [];
  for (const [x, y, z] of pts) {
    out.push(x / scale, y / scale, z / scale);
  }
  return out;
}

// Order two hands left-to-right by mean x, matching extract_landmarks.py
export function orderHands(handsLandmarks) {
  return [...handsLandmarks].sort((a, b) => {
    const ax = a.reduce((s, p) => s + p.x, 0) / a.length;
    const bx = b.reduce((s, p) => s + p.x, 0) / b.length;
    return ax - bx;
  });
}
