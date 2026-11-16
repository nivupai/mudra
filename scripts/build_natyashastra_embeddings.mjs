/**
 * Precompute sentence embeddings for every Natyashastra chunk so the
 * browser only has to embed the visitor's question (not 1,278 passages).
 *
 * Output: public/data/natyashastra_embeddings.bin
 *   int8 vectors, one row of DIM bytes per chunk, in chunk order.
 *   Each row is L2-normalised then scaled by 127, so a dot product of two
 *   rows / 127^2 is their cosine similarity.
 *
 * Run from mudra-app/ (re-run whenever natyashastra_chunks.json changes):
 *   node scripts/build_natyashastra_embeddings.mjs
 */
import { pipeline } from "@huggingface/transformers";
import { readFileSync, writeFileSync } from "node:fs";

export const MODEL = "Xenova/bge-small-en-v1.5";
const DIM = 384;
const BATCH = 32;

const chunks = JSON.parse(readFileSync("public/data/natyashastra_chunks.json", "utf8"));
const embed = await pipeline("feature-extraction", MODEL, { dtype: "q8" });

const out = new Int8Array(chunks.length * DIM);
for (let i = 0; i < chunks.length; i += BATCH) {
  const batch = chunks.slice(i, i + BATCH).map((c) =>
    c.chapter ? `${c.chapter}. ${c.text}` : c.text
  );
  const t = await embed(batch, { pooling: "cls", normalize: true });
  const data = t.data;
  for (let j = 0; j < data.length; j++) {
    out[i * DIM + j] = Math.max(-127, Math.min(127, Math.round(data[j] * 127)));
  }
  process.stdout.write(`\r${Math.min(i + BATCH, chunks.length)}/${chunks.length}`);
}
writeFileSync("public/data/natyashastra_embeddings.bin", Buffer.from(out.buffer));
console.log(`\nwrote ${out.length} bytes`);
