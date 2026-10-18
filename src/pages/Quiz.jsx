import { useMemo, useState } from "react";
import { MUDRAS, SINGLE_HAND, DOUBLE_HAND } from "../data/mudras";
import { buildQuestions, QUIZ_SIZES } from "../data/quizEngine";
import "./Quiz.css";

const POOLS = {
  all: MUDRAS,
  single: SINGLE_HAND,
  double: DOUBLE_HAND,
};

export default function Quiz() {
  const [stage, setStage] = useState("setup"); // setup | playing | done
  const [poolKey, setPoolKey] = useState("all");
  const [size, setSize] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState([]);

  const pool = POOLS[poolKey];

  function start() {
    const qs = buildQuestions(pool, size, "mixed");
    setQuestions(qs);
    setQIndex(0);
    setScore(0);
    setMissed([]);
    setSelected(null);
    setStage("playing");
  }

  const current = questions[qIndex];

  function choose(option) {
    if (selected) return;
    setSelected(option);
    const correct = option.slug === current.answer.slug;
    if (correct) {
      setScore((s) => s + 1);
    } else {
      setMissed((m) => [...m, { q: current, picked: option }]);
    }
  }

  function next() {
    if (qIndex + 1 >= questions.length) {
      setStage("done");
    } else {
      setQIndex((i) => i + 1);
      setSelected(null);
    }
  }

  const progressPct = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((qIndex) / questions.length) * 100);
  }, [qIndex, questions.length]);

  if (stage === "setup") {
    return (
      <div className="container quiz-page">
        <h1 className="section-title">Quiz Yourself</h1>
        <p className="section-sub">
          Multiple choice, mixed direction — sometimes you'll match a photo to its name,
          sometimes a name to its photo. Pick a set and go.
        </p>
        <div className="quiz-setup-card">
          <div className="setup-group">
            <h3>Mudra set</h3>
            <div className="archive-filters">
              {[
                ["all", `All (${MUDRAS.length})`],
                ["single", `Single-hand (${SINGLE_HAND.length})`],
                ["double", `Double-hand (${DOUBLE_HAND.length})`],
              ].map(([val, label]) => (
                <button
                  key={val}
                  className={"filter-chip" + (poolKey === val ? " active" : "")}
                  onClick={() => setPoolKey(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="setup-group">
            <h3>Number of questions</h3>
            <div className="archive-filters">
              {QUIZ_SIZES.map((n) => (
                <button
                  key={n}
                  className={"filter-chip" + (size === n ? " active" : "")}
                  onClick={() => setSize(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button className="btn gold start-btn" onClick={start}>Start quiz →</button>
        </div>
      </div>
    );
  }

  if (stage === "done") {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="container quiz-page">
        <h1 className="section-title">Quiz complete</h1>
        <div className="quiz-result-card">
          <div className="result-score">{score} / {questions.length}</div>
          <div className="result-pct">{pct}% correct</div>
          {missed.length > 0 && (
            <div className="missed-list">
              <h3>Review these</h3>
              <ul>
                {missed.map((m, i) => (
                  <li key={i}>
                    <strong>{m.q.answer.name}</strong> — you picked {m.picked.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="detail-actions">
            <button className="btn gold" onClick={start}>Play again</button>
            <button className="btn secondary" onClick={() => setStage("setup")}>Change settings</button>
          </div>
        </div>
      </div>
    );
  }

  // playing
  return (
    <div className="container quiz-page">
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="quiz-counter">Question {qIndex + 1} / {questions.length} · Score {score}</p>

      {current.direction === "nameFromImage" ? (
        <>
          <h2 className="quiz-prompt">What is this mudra called?</h2>
          <div className="quiz-image-wrap">
            <img src={current.image} alt="mystery mudra" className="quiz-image" />
          </div>
          <div className="quiz-options">
            {current.options.map((opt) => (
              <button
                key={opt.slug}
                className={optionClass(opt, current, selected)}
                onClick={() => choose(opt)}
                disabled={!!selected}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 className="quiz-prompt">Which photo shows "{current.answer.name}"?</h2>
          <div className="quiz-image-options">
            {current.options.map((opt) => (
              <button
                key={opt.slug}
                className={"quiz-image-option" + imgOptSuffix(opt, current, selected)}
                onClick={() => choose(opt)}
                disabled={!!selected}
              >
                <img src={opt.images[0]} alt={opt.name} />
              </button>
            ))}
          </div>
        </>
      )}

      {selected && (
        <div className="quiz-feedback">
          <p className={selected.slug === current.answer.slug ? "feedback-correct" : "feedback-wrong"}>
            {selected.slug === current.answer.slug
              ? "Correct!"
              : `Not quite — that's ${current.answer.name}.`}
          </p>
          <button className="btn gold" onClick={next}>
            {qIndex + 1 >= questions.length ? "See results →" : "Next →"}
          </button>
        </div>
      )}
    </div>
  );
}

function optionClass(opt, current, selected) {
  let cls = "quiz-option";
  if (!selected) return cls;
  if (opt.slug === current.answer.slug) cls += " correct";
  else if (opt.slug === selected.slug) cls += " wrong";
  return cls;
}

function imgOptSuffix(opt, current, selected) {
  if (!selected) return "";
  if (opt.slug === current.answer.slug) return " correct";
  if (opt.slug === selected.slug) return " wrong";
  return "";
}
