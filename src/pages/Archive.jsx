import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SINGLE_HAND, DOUBLE_HAND, MUDRAS } from "../data/mudras";
import "./Archive.css";

function MudraGrid({ mudras }) {
  return (
    <div className="archive-grid">
      {mudras.map((m) => (
        <Link key={m.slug} to={`/archive/${m.slug}`} className="archive-card">
          <div className="archive-card-img">
            <img src={m.images[0]} alt={m.name} loading="lazy" />
          </div>
          <div className="archive-card-caption">{m.name}</div>
        </Link>
      ))}
    </div>
  );
}

export default function Archive() {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const matches = (m) => !q || m.name.toLowerCase().includes(q);

  const singles = useMemo(() => SINGLE_HAND.filter(matches), [q]);
  const doubles = useMemo(() => DOUBLE_HAND.filter(matches), [q]);
  const noResults = query && singles.length === 0 && doubles.length === 0;

  return (
    <div className="container archive-page">
      <h1 className="section-title">Hasta Archive</h1>
      <p className="section-sub">
        Hastabhedah comes in two varieties — single-hand gestures, called{" "}
        <em>Asamyukta Hasta</em>, and two-hand gestures, called <em>Samyukta Hasta</em>.
        This archive covers all {MUDRAS.length} hastas in the dataset: {SINGLE_HAND.length}{" "}
        Asamyukta and {DOUBLE_HAND.length} Samyukta. Click any card for more reference
        photos and its meaning.
      </p>

      <input
        className="archive-search"
        placeholder="Search by name…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {noResults && <p className="archive-empty">No mudras match "{query}".</p>}

      {singles.length > 0 && (
        <section className="archive-section">
          <h2 className="archive-section-title">
            Single-Hand Mudras <span className="archive-section-sub-label">Asamyukta Hasta</span>
          </h2>
          <MudraGrid mudras={singles} />
        </section>
      )}

      {doubles.length > 0 && (
        <section className="archive-section">
          <h2 className="archive-section-title">
            Double-Hand Mudras <span className="archive-section-sub-label">Samyukta Hasta</span>
          </h2>
          <MudraGrid mudras={doubles} />
        </section>
      )}
    </div>
  );
}
