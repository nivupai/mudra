import { useMemo, useState } from "react";
import { MUDRAS } from "../data/mudras";
import "./Flashcards.css";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Flashcards() {
  const [filter, setFilter] = useState("all");
  const [deck, setDeck] = useState(() => shuffle(MUDRAS));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState({});
  const [learning, setLearning] = useState({});

  const filtered = useMemo(() => {
    const base = deck.filter((m) => filter === "all" || m.category === filter);
    return base;
  }, [deck, filter]);

  const card = filtered[index % filtered.length];
  const doneCount = Object.keys(known).length + Object.keys(learning).length;

  function goTo(delta) {
    setFlipped(false);
    setIndex((i) => {
      const len = filtered.length;
      return (((i + delta) % len) + len) % len;
    });
  }

  function mark(bucket) {
    if (!card) return;
    if (bucket === "known") {
      setKnown((k) => ({ ...k, [card.slug]: true }));
      setLearning((l) => {
        const { [card.slug]: _, ...rest } = l;
        return rest;
      });
    } else {
      setLearning((l) => ({ ...l, [card.slug]: true }));
      setKnown((k) => {
        const { [card.slug]: _, ...rest } = k;
        return rest;
      });
    }
    goTo(1);
  }

  function reshuffle() {
    setDeck(shuffle(MUDRAS));
    setIndex(0);
    setFlipped(false);
  }

  function resetProgress() {
    setKnown({});
    setLearning({});
  }

  if (!card) return null;

  return (
    <div className="container flash-page">
      <h1 className="section-title">Flashcards</h1>
      <p className="section-sub">
        Click the card to flip between the photo and the name. Sort each mudra into
        "I know it" or "still learning" to build your personal review set.
      </p>

      <div className="flash-controls">
        <div className="archive-filters">
          {[
            ["all", "All"],
            ["single", "Single-hand"],
            ["double", "Double-hand"],
          ].map(([val, label]) => (
            <button
              key={val}
              className={"filter-chip" + (filter === val ? " active" : "")}
              onClick={() => {
                setFilter(val);
                setIndex(0);
                setFlipped(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flash-progress">
          {doneCount} / {MUDRAS.length} sorted · <span className="known-count">{Object.keys(known).length} known</span> ·{" "}
          <span className="learning-count">{Object.keys(learning).length} learning</span>
        </div>
      </div>

      <div className="flash-stage">
        <span className="flash-count">{(index % filtered.length) + 1} / {filtered.length}</span>
        <div className="flashcard" onClick={() => setFlipped((f) => !f)}>
          <div className={"flashcard-inner" + (flipped ? " flipped" : "")}>
            <div className="flashcard-face flashcard-front">
              <img src={card.images[0]} alt={card.name} />
              <span className="flip-hint">tap to flip</span>
            </div>
            <div className="flashcard-face flashcard-back">
              <span className={`pill ${card.category}`}>{card.category === "single" ? "Single" : "Double"}</span>
              <h2>{card.name}</h2>
              <p>{card.description}</p>
            </div>
          </div>
        </div>

        <div className="flash-nav">
          <button className="btn secondary" onClick={() => goTo(-1)}>‹ Prev</button>
          <button className="btn secondary" onClick={() => goTo(1)}>Next ›</button>
        </div>

        <div className="flash-sort">
          <button className="btn learning-btn" onClick={() => mark("learning")}>Still learning</button>
          <button className="btn known-btn" onClick={() => mark("known")}>I know it</button>
        </div>

        <div className="flash-utility">
          <button className="btn secondary small" onClick={reshuffle}>Shuffle deck</button>
          <button className="btn secondary small" onClick={resetProgress}>Reset progress</button>
        </div>
      </div>
    </div>
  );
}
