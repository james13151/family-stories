import path from "path";
import { Converter } from "opencc-js";
import { decodeWavToMono } from "@/lib/audio/wav";

const toHongKong = Converter({ from: "cn", to: "hk" });

function suppressLoop(text: string) {
  const parts = text
    .trim()
    .split(/[\s，。、“”！？,.!?]+/)
    .filter(Boolean);
  if (parts.length < 8) return text.trim();
  const counts = new Map<string, number>();
  for (const part of parts) counts.set(part, (counts.get(part) || 0) + 1);
  const top = Math.max(...counts.values());
  if (top / parts.length >= 0.6) return "";
  return text.trim();
}

type Transcriber = (
  audio: Float32Array,
  options: Record<string, unknown>,
) => Promise<{ text?: string }>;

const globalForStt = globalThis as unknown as { hearthlightTranscriber?: Promise<Transcriber> };

function whisperLanguage(locale: string) {
  return locale.startsWith("zh") ? "chinese" : "english";
}

async function localTranscriber() {
  if (!globalForStt.hearthlightTranscriber) {
    globalForStt.hearthlightTranscriber = (async () => {
      const transformers = await import("@xenova/transformers");
      const env = transformers.env;
      env.cacheDir = process.env.STT_CACHE_DIR || path.join(process.cwd(), "data", "models");
      if (process.env.HF_ENDPOINT) {
        env.remoteHost = `${process.env.HF_ENDPOINT.replace(/\/$/, "")}/`;
      }
      const model = process.env.STT_MODEL || "Xenova/whisper-base";
      return (await transformers.pipeline("automatic-speech-recognition", model, {
        quantized: true,
      })) as unknown as Transcriber;
    })();
  }
  return globalForStt.hearthlightTranscriber;
}

async function transcribeWithTransformers(wav: Buffer, locale: string) {
  const { samples } = decodeWavToMono(wav);
  const transcriber = await localTranscriber();
  const result = await transcriber(samples, {
    language: whisperLanguage(locale),
    task: "transcribe",
    chunk_length_s: 30,
    stride_length_s: 5,
  });
  return (result.text || "").replace(/\s+/g, " ").trim();
}

async function transcribeWithHttp(wav: Buffer, locale: string) {
  const url = process.env.STT_HTTP_URL;
  if (!url) throw new Error("STT_HTTP_URL is not set");
  const language = locale.startsWith("zh") ? "zh" : "en";
  const headers: Record<string, string> = {};
  if (process.env.STT_HTTP_KEY) headers.authorization = `Bearer ${process.env.STT_HTTP_KEY}`;
  let response: Response;
  if ((process.env.STT_HTTP_FORMAT || "json") === "openai") {
    const body = new FormData();
    body.set("file", new Blob([new Uint8Array(wav)], { type: "audio/wav" }), "story.wav");
    body.set("model", process.env.STT_MODEL || "whisper-1");
    body.set("language", language);
    response = await fetch(url, { method: "POST", headers, body });
  } else {
    headers["content-type"] = "audio/wav";
    headers["x-language"] = language;
    response = await fetch(url, { method: "POST", headers, body: new Uint8Array(wav) });
  }
  if (!response.ok) {
    throw new Error(`speech service responded ${response.status}`);
  }
  const payload = (await response.json()) as { text?: string };
  return (payload.text || "").trim();
}

export async function transcribeRecording(wav: Buffer, locale: string) {
  const provider = (process.env.STT_PROVIDER || "transformers").toLowerCase();
  if (provider === "none" || provider === "off") {
    return { text: "", provider: "none" };
  }
  const raw =
    provider === "http" ? await transcribeWithHttp(wav, locale) : await transcribeWithTransformers(wav, locale);
  const converted = locale === "zh-Hant" ? toHongKong(raw) : raw;
  return { text: suppressLoop(converted), provider };
}
