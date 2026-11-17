import { useEffect, useRef, useState } from "react";
import { search } from "../data/natyashastraSearch";
import { retrieve } from "../data/natyashastraRetrieval";
import { MODELS, answer, checkSupport, interrupt, isModelCached, loadEngine } from "../data/natyaLLM";
import "./NatyaShastra.css";

const EXAMPLES = [
  "How did Brahmā create the Nāṭyaveda?",
  "What are the eight rasas?",
  "How is the playhouse built?",
  "What is the difference between rasa and bhāva?",
  "hasta mudras",
];

// Which model size the visitor turned on ("standard" | "lite"), if any.
const AI_PREF_KEY = "natya-ai-model";
function readPref() {
  try {
    const v = localStorage.getItem(AI_PREF_KEY);
    return v in MODELS ? v : null;
  } catch {
    return null;
  }
}
function writePref(size) {
  try {
    if (size) localStorage.setItem(AI_PREF_KEY, size);
    else localStorage.removeItem(AI_PREF_KEY);
  } catch {
    /* storage blocked: the preference just won't persist */
  }
}

// Turns "[2]" / "[1][3]" citations in the model's answer into links to the
// numbered source cards below it.
function renderAnswer(text, sourceCount) {
  // Small models sometimes write "passage 2" instead of "[2]"; link those too.
  text = text.replace(/\b(passages?) (\d+)\b/gi, "$1 [$2]");
  return text.split(/(\[\d+\])/g).map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= sourceCount) {
      return (
        <a key={i} className="natya-cite" href={`#natya-src-${m[1]}`}>
          {m[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

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

  // AI answer state
  const [support, setSupport] = useState("checking"); // checking | ok | no-webgpu
  const [ai, setAi] = useState("off"); // off | loading | ready | error
  const [progress, setProgress] = useState({ progress: 0, text: "" });
  const [asked, setAsked] = useState(null); // { question, sources, answer, state }
  const askIdRef = useRef(0);

  useEffect(() => {
    checkSupport().then(async (s) => {
      setSupport(s);
      // Re-open the model automatically only if the visitor turned it on
      // before and the weights are already in the browser cache.
      const size = readPref();
      if (s === "ok" && size && (await isModelCached(size))) enableAi(size);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function enableAi(size) {
    setAi("loading");
    setProgress({ progress: 0, text: "" });
    writePref(size);
    loadEngine(size, setProgress)
      .then(() => setAi("ready"))
      .catch((err) => {
        console.error(err);
        setAi(size === "standard" ? "error" : "error-lite");
        writePref(null);
      });
  }

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

  async function ask(question) {
    const q = question.trim();
    if (!q) return;
    interrupt();
    const id = ++askIdRef.current;
    const update = (patch) => {
      if (askIdRef.current === id) setAsked((prev) => ({ ...prev, ...patch }));
    };
    setAsked({ question: q, sources: [], answer: "", state: "retrieving" });
    const sources = await retrieve(q, 5);
    update({ sources, state: ai === "ready" ? "thinking" : "sources" });
    if (ai !== "ready" || !sources.length) return;
    try {
      await answer(q, sources, (text) => update({ answer: text, state: "writing" }));
      update({ state: "done" });
    } catch (err) {
      console.error(err);
      update({ state: "error" });
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    ask(query);
  }

  const terms = query.trim().split(/\s+/).filter((w) => w.length > 2);
  const showAsked = asked && asked.question === query.trim();

  return (
    <div className="container natya-page">
      <h1 className="section-title">Ask the Nāṭyaśāstra</h1>
      <p className="section-sub">
        Ask a question about Manomohan Ghosh's English translation of the
        Nāṭyaśāstra (Vol. I). It finds the most relevant passages, with their
        chapter and page, and an optional AI guide that runs entirely in your
        browser can answer from those passages, citing each one. The guide is
        a small model and can make mistakes, so check its citations.
      </p>

      <AiPanel support={support} ai={ai} progress={progress} onEnable={enableAi} />

      <form className="natya-ask" onSubmit={onSubmit}>
        <input
          className="natya-search"
          placeholder="Ask or search, e.g. “What are the eight rasas?”"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <button className="natya-ask-btn" type="submit" disabled={!query.trim()}>
          {ai === "ready" ? "Ask" : "Find passages"}
        </button>
      </form>

      {!query.trim() && (
        <div className="natya-examples">
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              className="natya-example-chip"
              onClick={() => {
                setQuery(ex);
                ask(ex);
              }}
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {showAsked ? (
        <AskedView asked={asked} aiReady={ai === "ready"} />
      ) : (
        <>
          {status === "loading" && <p className="natya-status">Searching…</p>}
          {status === "done" && results.length === 0 && (
            <p className="natya-status">No passages found for "{query}". Try a different word.</p>
          )}
          {status === "done" && results.length > 0 && (
            <p className="natya-status">
              Keyword matches. Press Enter to {ai === "ready" ? "ask the guide" : "find the best passages"}.
            </p>
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
        </>
      )}
    </div>
  );
}

function AiPanel({ support, ai, progress, onEnable }) {
  if (support === "checking" || ai === "ready") {
    return ai === "ready" ? (
      <p className="natya-ai-note natya-ai-on">AI guide is on. It runs on your device; nothing you ask leaves your browser.</p>
    ) : null;
  }
  if (support === "no-webgpu") {
    return (
      <p className="natya-ai-note">
        The AI guide needs WebGPU, which this browser doesn't offer (try recent
        Chrome, Edge or Safari on a computer). You can still search the passages.
      </p>
    );
  }
  if (ai === "loading") {
    const pct = Math.round((progress.progress || 0) * 100);
    return (
      <div className="natya-ai-note">
        <div className="natya-progress">
          <div className="natya-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <small>Loading the AI guide… {pct}%. The first time takes a few minutes; after that it's cached.</small>
      </div>
    );
  }
  if (ai === "error-lite") {
    return (
      <p className="natya-ai-note">
        The AI guide couldn't start on this device, so here are the passages
        on their own. Search still works.
      </p>
    );
  }
  const std = MODELS.standard;
  const lite = MODELS.lite;
  return (
    <div className="natya-ai-note">
      {ai === "error" && (
        <p>
          The AI guide couldn't start, probably for lack of GPU memory. The
          lighter model may still work on this device.
        </p>
      )}
      {ai !== "error" && (
        <button className="natya-enable-btn" onClick={() => onEnable("standard")}>
          Turn on the AI guide
        </button>
      )}
      <small>
        Free and private: {std.label} downloads once ({std.download}) and runs
        on your own GPU.{" "}
        <button className="natya-link-btn" onClick={() => onEnable("lite")}>
          Use the lighter model instead
        </button>{" "}
        ({lite.label}, {lite.download}, less accurate).
      </small>
    </div>
  );
}

function AskedView({ asked, aiReady }) {
  const { sources, answer: text, state } = asked;
  return (
    <div className="natya-asked">
      {state === "retrieving" && <p className="natya-status">Finding the most relevant passages…</p>}
      {aiReady && state !== "retrieving" && sources.length > 0 && (
        <section className="natya-answer">
          <h2>Answer</h2>
          {state === "thinking" && <p className="natya-status">Reading the passages…</p>}
          {text && <p>{renderAnswer(text, sources.length)}</p>}
          {state === "error" && <p className="natya-status">Something went wrong generating the answer. The passages are below.</p>}
        </section>
      )}
      {state !== "retrieving" && sources.length === 0 && (
        <p className="natya-status">No passages found. Try different words.</p>
      )}
      {sources.length > 0 && <h2 className="natya-sources-title">Sources</h2>}
      <div className="natya-results">
        {sources.map((r, i) => (
          <article key={r.id} id={`natya-src-${i + 1}`} className="natya-result">
            <div className="natya-result-meta">
              <span className="natya-chapter">
                <span className="natya-src-num">{i + 1}</span>
                {r.chapter || "Front matter"}
              </span>
              <span className="natya-page-num">p. {r.page}</span>
            </div>
            <p className="natya-excerpt">{r.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
