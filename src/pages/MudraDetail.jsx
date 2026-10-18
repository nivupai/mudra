import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMudra } from "../data/mudras";
import "./MudraDetail.css";

export default function MudraDetail() {
  const { slug } = useParams();
  const mudra = getMudra(slug);
  const [active, setActive] = useState(0);

  if (!mudra) {
    return (
      <div className="container detail-page">
        <p>Mudra not found.</p>
        <Link to="/archive" className="btn secondary">Back to archive</Link>
      </div>
    );
  }

  return (
    <div className="container detail-page">
      <Link to="/archive" className="back-link">← Back to archive</Link>
      <div className="detail-grid">
        <div className="detail-gallery">
          <div className="detail-main-img">
            <img src={mudra.images[active]} alt={mudra.name} />
          </div>
          <div className="detail-thumbs">
            {mudra.images.map((src, i) => (
              <button
                key={src}
                className={"detail-thumb" + (i === active ? " active" : "")}
                onClick={() => setActive(i)}
              >
                <img src={src} alt={`${mudra.name} ${i + 1}`} />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-info">
          <span className={`pill ${mudra.category}`}>
            {mudra.category === "single" ? "Single-hand (Asamyukta)" : "Double-hand (Samyukta)"}
          </span>
          <h1>{mudra.name}</h1>
          <p className="detail-desc">{mudra.description}</p>
          <p className="detail-meta">
            {mudra.totalImages.toLocaleString()} reference photos in the source dataset.
          </p>
          <div className="detail-actions">
            <Link to="/flashcards" className="btn gold">Practice with flashcards</Link>
            <Link to="/quiz" className="btn secondary">Take a quiz</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
