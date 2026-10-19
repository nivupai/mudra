import MiniSearch from "minisearch";

const BASE = import.meta.env.BASE_URL;

// Default tokenizer only splits on ASCII non-word chars, which would mangle
// Sanskrit diacritics (ā, ī, ś, ṭ, ñ, ...). Split on anything that isn't a
// Unicode letter/mark/number instead, so IAST words stay intact.
const TOKENIZE = (text) =>
  text.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);

let indexPromise = null;
let chunksById = null;

export function loadIndex() {
  if (!indexPromise) {
    indexPromise = fetch(`${BASE}data/natyashastra_chunks.json`)
      .then((res) => res.json())
      .then((chunks) => {
        chunksById = new Map();
        const docs = chunks.map((c, id) => {
          chunksById.set(id, c);
          return { id, ...c };
        });
        const mini = new MiniSearch({
          fields: ["text", "chapter"],
          storeFields: ["page", "chapter", "text"],
          tokenize: TOKENIZE,
          searchOptions: {
            boost: { chapter: 2 },
            fuzzy: 0.2,
            prefix: true,
          },
        });
        mini.addAll(docs);
        return mini;
      });
  }
  return indexPromise;
}

export async function search(query, limit = 12) {
  const mini = await loadIndex();
  if (!query.trim()) return [];
  return mini.search(query).slice(0, limit);
}
