import { Link } from "react-router-dom";
import "./Recognize.css";

export default function Recognize() {
  return (
    <div className="container recognize-page">
      <h1 className="section-title">Mudra Recognition</h1>
      <p className="section-sub">Live, webcam-based mudra recognition is in progress.</p>

      <div className="recognize-card">
        <div className="recognize-emoji">🤲</div>
        <h2>Coming soon</h2>
        <p>
          The original gesture-recognition project trained a CNN on this dataset,
          but it never shipped a usable model file. Building a reliable, fully
          in-browser recognizer means re-training a hand-pose classifier (e.g. on
          MediaPipe hand landmarks) and exporting it to run client-side — that's
          its own project. For now, use the Archive, Flashcards, and Quiz to learn
          the hastas; this page will host a live webcam demo once the model is trained
          and exported.
        </p>
        <div className="detail-actions">
          <Link to="/flashcards" className="btn gold">Practice flashcards instead</Link>
          <Link to="/quiz" className="btn secondary">Take a quiz</Link>
        </div>
      </div>
    </div>
  );
}
