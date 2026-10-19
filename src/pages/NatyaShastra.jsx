import { useEffect, useRef, useState } from "react";
import { search } from "../data/natyashastraSearch";
import "./NatyaShastra.css";

const EXAMPLES = [
  "origin of the Nāṭyaveda",
  "hasta mudras",
  "rasa and bhava",
  "drishti eye movements",
  "the playhouse",
];

function highlight(text, terms) {
  if (!terms.length) return text;
  const pattern = new RegExp(`(${terms.map(escapeRegex).join("|")})`, "giu");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
      <mark key={i}>{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function excerptAround(text, terms, radius = 220) {
  if (!terms.length) return text.slice(0, radius * 2);
  const lower = text.toLowerCase();
  let hitIndex = -1;
  for (const t of terms) {
    const idx = lower.indexOf(t.toLowerCase());
    if (idx !== -1 && (hitIndex === -1 || idx < hitIndex)) hitIndex = idx;
  }
  if (hitIndex === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, hitIndex - radius);
  const end = Math.min(text.length, hitIndex + radius);
  return (start > 0 ? "… " : "") + text.slice(start, end) + (end < text.length ? " …" : "");
}

export default function NatyaShastra() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | done
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const r = await search(query);
      setResults(r);
      setStatus("done");
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const terms = query.trim().split(/\s+/).filter((w) => w.length > 2);

  return (
    <div className="container natya-page">
      <h1 className="section-title">Ask the Nāṭyaśāstra</h1>
      <p className="section-sub">
        A search tool over Manomohan Ghosh's English translation of the
        Nāṭyaśāstra (Vol. I) — type a question or topic and it surfaces the
        most relevant passages, verbatim, with their chapter and page. This
        isn't an AI assistant; it doesn't summarize or answer in its own
        words, it just finds what the text itself says.
      </p>

      <input
        className="natya-search"
        placeholder="Search the text — e.g. “hasta mudras”, “rasa”, “the playhouse”…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />

      {!query.trim() && (
        <div className="natya-examples">
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} className="natya-example-chip" onClick={() => setQuery(ex)}>
              {ex}
            </button>
          ))}
        </div>
      )}

      {status === "loading" && <p className="natya-status">Searching…</p>}

      {status === "done" && results.length === 0 && (
        <p className="natya-status">No passages found for "{query}". Try a different word.</p>
      )}

      <div className="natya-results">
        {results.map((r) => (
          <article key={r.id} className="natya-result">
            <div className="natya-result-meta">
              {r.chapter && <span className="natya-chapter">{r.chapter}</span>}
              <span className="natya-page-num">p. {r.page}</span>
            </div>
            <p className="natya-excerpt">
              {highlight(excerptAround(r.text, terms), terms)}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
