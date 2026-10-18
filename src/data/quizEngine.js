import { MUDRAS } from "./mudras";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// direction: "nameFromImage" | "imageFromName"
export function buildQuestions(pool, count, direction = "mixed") {
  const chosen = shuffle(pool).slice(0, Math.min(count, pool.length));
  return chosen.map((mudra) => {
    const dir = direction === "mixed" ? (Math.random() < 0.5 ? "nameFromImage" : "imageFromName") : direction;
    const distractorPool = pool.filter((m) => m.slug !== mudra.slug);
    const distractors = shuffle(distractorPool).slice(0, 3);
    const options = shuffle([mudra, ...distractors]);
    return {
      id: mudra.slug + "-" + Math.random().toString(36).slice(2, 7),
      direction: dir,
      answer: mudra,
      options,
      image: mudra.images[Math.floor(Math.random() * mudra.images.length)],
    };
  });
}

export const QUIZ_SIZES = [10, 20, MUDRAS.length];
