// In-browser LLM (WebLLM + WebGPU) that answers questions from retrieved
// Natyashastra passages. No server, no API key: the model weights are
// downloaded once from Hugging Face and cached by the browser.
// web-llm is imported lazily so its ~6 MB runtime only loads when the
// visitor turns the guide on.

// Two sizes: "standard" answers noticeably more faithfully; "lite" is for
// machines with less GPU memory. Each has an f16 build and an f32 fallback
// for GPUs without the shader-f16 feature.
export const MODELS = {
  standard: {
    label: "Llama 3.2 3B",
    download: "about 1.8 GB",
    f16: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    f32: "Llama-3.2-3B-Instruct-q4f32_1-MLC",
  },
  lite: {
    label: "Qwen2.5 1.5B",
    download: "about 1 GB",
    f16: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    f32: "Qwen2.5-1.5B-Instruct-q4f32_1-MLC",
  },
};

let enginePromise = null;
let hasF16 = false;

/** "ok" | "no-webgpu" — resolved once per page load. */
let supportPromise = null;
export function checkSupport() {
  if (!supportPromise) {
    supportPromise = (async () => {
      if (typeof navigator === "undefined" || !navigator.gpu) return "no-webgpu";
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) return "no-webgpu";
        hasF16 = adapter.features.has("shader-f16");
        return "ok";
      } catch {
        return "no-webgpu";
      }
    })();
  }
  return supportPromise;
}

export async function isModelCached(size) {
  if ((await checkSupport()) !== "ok") return false;
  try {
    const { hasModelInCache } = await import("@mlc-ai/web-llm");
    return await hasModelInCache(modelIdFor(size));
  } catch {
    return false;
  }
}

function modelIdFor(size) {
  const m = MODELS[size] || MODELS.standard;
  return hasF16 ? m.f16 : m.f32;
}

/**
 * Loads (or returns) the engine for a model size ("standard" | "lite").
 * onProgress gets {progress: 0..1, text}.
 */
export function loadEngine(size, onProgress) {
  if (!enginePromise) {
    enginePromise = (async () => {
      if ((await checkSupport()) !== "ok") throw new Error("WebGPU is not available");
      const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
      const id = modelIdFor(size);
      const worker = new Worker(new URL("../workers/llm.worker.js", import.meta.url), {
        type: "module",
      });
      try {
        return await CreateWebWorkerMLCEngine(worker, id, {
          initProgressCallback: (p) => onProgress?.(p),
        });
      } catch (err) {
        worker.terminate();
        throw err;
      }
    })();
    enginePromise.catch(() => (enginePromise = null));
  }
  return enginePromise;
}

const SYSTEM_PROMPT = `You are a careful guide to Bharata's Nāṭyaśāstra, using Manomohan Ghosh's English translation.
Answer the question using ONLY the numbered passages provided. After each statement, cite the passage it comes from with its number in square brackets, like [1] or [2][4]. Never write "passage 2"; write [2].
If the passages do not contain the answer, say plainly that these excerpts don't cover it, and do not guess.
Keep Sanskrit terms as the passages spell them. Answer in clear prose, at most about 180 words.`;

function trimWords(text, max) {
  const words = text.split(/\s+/);
  return words.length > max ? words.slice(0, max).join(" ") + " …" : text;
}

/**
 * Streams an answer grounded in `passages`. Calls onToken(fullTextSoFar).
 * Returns the final text.
 */
export async function answer(question, passages, onToken) {
  if (!enginePromise) throw new Error("Model not loaded");
  const engine = await enginePromise;
  const context = passages
    .map(
      (p, i) =>
        `[${i + 1}] (${p.chapter || "Front matter"}, p. ${p.page})\n${trimWords(p.text, 220)}`
    )
    .join("\n\n");

  await engine.resetChat();
  const stream = await engine.chat.completions.create({
    stream: true,
    temperature: 0.2,
    max_tokens: 450,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Passages:\n\n${context}\n\nQuestion: ${question}\n\nAnswer only from the passages above, citing them like [1].` },
    ],
  });

  let text = "";
  for await (const chunk of stream) {
    text += chunk.choices[0]?.delta?.content || "";
    onToken?.(text);
  }
  return text;
}

export function interrupt() {
  enginePromise?.then((e) => e.interruptGenerate()).catch(() => {});
}
