# Natya Archive

An interactive archive, flashcard, and quiz app for learning the hand gestures
(mudras) of Bharatanatyam.

Live at **https://nivupai.github.io/mudra/**

## Features

- **Archive** — all 50 hastas, split into Single-Hand (Asamyukta) and
  Double-Hand (Samyukta) sections, each with reference photos and a short
  description.
- **Flashcards** — Quizlet-style flip cards with shuffle and "know it" /
  "still learning" sorting.
- **Quiz** — mixed-direction multiple choice (name → photo and photo → name).
- **Recognize** — live webcam mudra recognition. Runs entirely client-side:
  MediaPipe HandLandmarker tracks hand joints, a small MLP (trained on
  landmarks extracted from the dataset, see `ml/`) classifies the pose.
  Nothing leaves the browser.
- **Nāṭyaśāstra** — ask questions about Manomohan Ghosh's English
  translation (Vol. I). Everything runs in the browser, with no backend and
  no API key:
  - *Retrieval*: keyword search (MiniSearch) fused with meaning-based search
    over precomputed `bge-small-en-v1.5` embeddings
    (`public/data/natyashastra_embeddings.bin`); only the question is
    embedded in the browser, via transformers.js.
  - *Optional AI guide*: a small open model (Llama 3.2 3B, or Qwen2.5 1.5B
    as a lighter option) runs on the visitor's GPU via WebLLM/WebGPU and
    answers from the top 5 passages with numbered citations. The weights
    download once (1–2 GB) and are cached. Browsers without WebGPU get the
    passages only.
  - If `natyashastra_chunks.json` changes, rebuild the embeddings with
    `node scripts/build_natyashastra_embeddings.mjs`.

## Data

Sample images are drawn from the [Bharatanatyam Mudra
Dataset](https://github.com/jisharajr/Bharatanatyam-Mudra-Dataset) (Jisha Raj
R., College of Engineering Attingal), released under CC BY-SA 4.0.

## Development

```bash
npm install --legacy-peer-deps
npm run dev
```

`--legacy-peer-deps` works around a known npm/arborist bug with this Vite
template's peer dependencies.

## Deployment

Pushes to `main` build and deploy automatically via the GitHub Actions
workflow in `.github/workflows/deploy.yml`, publishing to GitHub Pages at
`/mudra/`.
