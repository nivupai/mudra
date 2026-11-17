// Hybrid retrieval over the Natyashastra chunks: keyword search (MiniSearch,
// good for Sanskrit terms) fused with meaning-based search (precomputed
// bge-small embeddings, good for paraphrased questions). Everything runs in
// the browser; the query embedder (~34 MB) is fetched once and cached.
import { loadIndex } from "./natyashastraSearch";

const BASE = import.meta.env.BASE_URL;
// Must match scripts/build_natyashastra_embeddings.mjs.
const EMBED_MODEL = "Xenova/bge-small-en-v1.5";
const DIM = 384;
const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

let vectorsPromise = null;
let embedderPromise = null;

function loadVectors() {
  if (!vectorsPromise) {
    vectorsPromise = fetch(`${BASE}data/natyashastra_embeddings.bin`)
      .then((r) => {
        if (!r.ok) throw new Error(`embeddings ${r.status}`);
        return r.arrayBuffer();
      })
      .then((buf) => new Int8Array(buf));
  }
  return vectorsPromise;
}

function loadEmbedder() {
  if (!embedderPromise) {
    embedderPromise = import("@huggingface/transformers").then(({ pipeline, env }) => {
      env.allowLocalModels = false;
      return pipeline("feature-extraction", EMBED_MODEL, { dtype: "q8" });
    });
    embedderPromise.catch(() => (embedderPromise = null));
  }
  return embedderPromise;
}

async function semanticRanking(query, limit) {
  const [vectors, embed] = await Promise.all([loadVectors(), loadEmbedder()]);
  const q = (await embed(QUERY_PREFIX + query, { pooling: "cls", normalize: true })).data;
  const n = vectors.length / DIM;
  const scores = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let dot = 0;
    const off = i * DIM;
    for (let j = 0; j < DIM; j++) dot += q[j] * vectors[off + j];
    scores[i] = dot;
  }
  return Array.from(scores.keys())
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, limit);
}

/**
 * Best passages for a question, via reciprocal rank fusion of keyword and
 * semantic rankings. Falls back to keyword-only if the embedder can't load.
 */
export async function retrieve(query, k = 5) {
  const mini = await loadIndex();
  const keyword = mini.search(query).slice(0, 30);
  const byId = new Map(keyword.map((r) => [r.id, r]));

  let semantic = [];
  try {
    semantic = await semanticRanking(query, 30);
  } catch (err) {
    console.warn("Semantic search unavailable, using keyword search only", err);
  }

  const RRF_K = 60;
  const fused = new Map();
  keyword.forEach((r, rank) => fused.set(r.id, (fused.get(r.id) || 0) + 1 / (RRF_K + rank)));
  semantic.forEach((id, rank) => fused.set(id, (fused.get(id) || 0) + 1 / (RRF_K + rank)));

  const docs = await allDocs();
  return [...fused.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([id]) => byId.get(id) || { id, ...docs[id] })
    .filter((d) => d && d.text);
}

let docsPromise = null;
function allDocs() {
  if (!docsPromise) {
    docsPromise = fetch(`${BASE}data/natyashastra_chunks.json`).then((r) => r.json());
  }
  return docsPromise;
}
