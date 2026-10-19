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
- **Nāṭyaśāstra** — full-text search over Manomohan Ghosh's English
  translation (Vol. I), entirely client-side (MiniSearch). Surfaces verbatim
  passages with chapter/page, not a generated answer — no LLM, no backend.

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
