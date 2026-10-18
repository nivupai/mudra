import { Link } from "react-router-dom";
import { MUDRAS, SINGLE_HAND, DOUBLE_HAND } from "../data/mudras";
import "./Home.css";

const FEATURES = [
  {
    to: "/archive",
    title: "Archive",
    emoji: "📜",
    desc: "Browse every hasta with reference photos, Sanskrit names, and what each gesture represents.",
  },
  {
    to: "/flashcards",
    title: "Flashcards",
    emoji: "🪷",
    desc: "Quizlet-style flip cards — flip, shuffle, and sort mudras into 'know it' and 'still learning' piles.",
  },
  {
    to: "/quiz",
    title: "Quiz",
    emoji: "🎯",
    desc: "Timed multiple-choice rounds that test whether you can name a mudra from its photo (and back again).",
  },
  {
    to: "/recognize",
    title: "Recognize",
    emoji: "🤲",
    desc: "Hold up a mudra to your webcam and a model trained on hand landmarks guesses which one it is.",
  },
];

export default function Home() {
  const sampleImg = MUDRAS[12]?.images?.[0];
  return (
    <div>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="hero-kicker">An interactive hasta kosha</p>
            <h1>Learn the mudras of Bharatanatyam</h1>
            <p className="hero-text">
              {MUDRAS.length} hastas — {SINGLE_HAND.length} single-hand (Asamyukta) and{" "}
              {DOUBLE_HAND.length} double-hand (Samyukta) gestures — drawn from a
              volunteer-collected photo dataset. Browse the archive, drill with
              flashcards, or test yourself with a quiz.
            </p>
            <div className="hero-actions">
              <Link className="btn gold" to="/archive">Explore the archive</Link>
              <Link className="btn secondary" to="/flashcards">Start flashcards</Link>
            </div>
          </div>
          {sampleImg && (
            <div className="hero-art">
              <img src={sampleImg} alt="Sample mudra" />
            </div>
          )}
        </div>
      </section>

      <section className="container features">
        {FEATURES.map((f) => (
          <Link key={f.to} to={f.to} className="feature-card">
            <span className="feature-emoji">{f.emoji}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </Link>
        ))}
      </section>

      <section className="container about">
        <h2 className="section-title">About this dataset</h2>
        <p className="section-sub">
          Images come from the <em>Bharatanatyam Mudra Dataset</em> (Jisha Raj R.,
          College of Engineering Attingal), 28,000+ photographs of 49 hastas
          collected from 15 volunteers, released under a CC BY-SA 4.0 license.
          This site shows a curated sample of each gesture for browsing and study.
        </p>
      </section>
    </div>
  );
}
