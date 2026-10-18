# Mudra Kosha

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
- **Recognize** — placeholder page; live webcam mudra recognition is a
  future addition (the original training notebooks never shipped a usable
  model).

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
