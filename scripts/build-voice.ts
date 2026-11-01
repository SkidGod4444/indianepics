/**
 * Narration: one mp3 per chapter opener, per event and for the prologue, in English and Hindi,
 * spoken by Sarvam AI (bulbul:v4-flash). Written to public/audio/<lang>/<key>.mp3 with a manifest.
 *
 *   SARVAM_API_KEY=... bun scripts/build-voice.ts            # everything that changed
 *   bun scripts/build-voice.ts --only kalinga-war,maurya     # a few keys
 *   bun scripts/build-voice.ts --lang en                      # one language
 *   bun scripts/build-voice.ts --scan                         # no API: rebuild the manifest from the mp3s on disk
 *                                                             # (clips made by another tool, e.g. the toonforge MCP)
 *
 * Incremental: each clip is keyed by a hash of text + voice + model, so re-runs only pay for changes.
 * Never part of `bun run build`; the site works without any audio (it falls back to timed scrolling).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const data = join(root, "src/data");
const out = join(root, "public/audio");
const manifestPath = join(out, "manifest.json");

const KEY = process.env.SARVAM_API_KEY;
const MODEL = process.env.SARVAM_MODEL ?? "bulbul:v4-flash";
const VOICES: Record<Lang, string> = {
  en: process.env.SARVAM_VOICE_EN ?? "varun_en_suspense",
  hi: process.env.SARVAM_VOICE_HI ?? "anand_hi_documentary",
};
const PACE = Number(process.env.SARVAM_PACE ?? 0.92);
const PITCH = Number(process.env.SARVAM_PITCH ?? -0.15);
const SAMPLE_RATE = 24000;

type Lang = "en" | "hi";
type Clip = { file: string; hash: string; chars: number; voice: string; model: string };
type Manifest = { model: string; voices: Record<Lang, string>; clips: Record<string, Partial<Record<Lang, Clip>>> };

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const only = flag("--only")?.split(",").filter(Boolean);
const langs: Lang[] = (flag("--lang")?.split(",") as Lang[] | undefined) ?? ["en", "hi"];
const dry = args.includes("--dry");
const scan = args.includes("--scan");

type Item = { key: string; voice?: string; voice_hi?: string };
const chapters: Item[] = JSON.parse(readFileSync(join(data, "chapters.json"), "utf8")).map((c: { id: string; voice?: string; voice_hi?: string }) => ({ key: c.id, voice: c.voice, voice_hi: c.voice_hi }));
const events: Item[] = JSON.parse(readFileSync(join(data, "events.json"), "utf8")).map((e: { id: string; voice?: string; voice_hi?: string }) => ({ key: e.id, voice: e.voice, voice_hi: e.voice_hi }));
const prologue = existsSync(join(data, "prologue.json")) ? (JSON.parse(readFileSync(join(data, "prologue.json"), "utf8")) as { voice: string; voice_hi?: string } | null) : null;
const items: Item[] = [...(prologue ? [{ key: "prologue", voice: prologue.voice, voice_hi: prologue.voice_hi }] : []), ...chapters, ...events];

const manifest: Manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, "utf8"))
  : { model: MODEL, voices: VOICES, clips: {} };
manifest.model = MODEL;
manifest.voices = VOICES;

const hashOf = (text: string, voice: string) => createHash("sha1").update(`${MODEL}|${voice}|${PACE}|${PITCH}|${SAMPLE_RATE}|${text}`).digest("hex").slice(0, 12);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function synth(text: string, lang: Lang): Promise<Buffer> {
  const body = {
    text,
    language_code: lang === "hi" ? "hi-IN" : "en-IN",
    model: MODEL,
    speaker: VOICES[lang],
    pace: PACE,
    pitch: PITCH,
    speech_sample_rate: SAMPLE_RATE,
    output_audio_codec: "mp3",
    enable_preprocessing: true,
  };
  for (let attempt = 0; ; attempt++) {
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: { "api-subscription-key": KEY!, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 429 && attempt < 5) {
      await sleep(1500 * 2 ** attempt + Math.random() * 500);
      continue;
    }
    if (!res.ok) {
      // A 400 lists the valid speaker IDs: print it whole so a wrong voice name is fixable without guessing.
      throw new Error(`Sarvam ${res.status} for ${lang}/${VOICES[lang]}: ${await res.text()}`);
    }
    const json = (await res.json()) as { audios: string[] };
    return Buffer.from(json.audios.join(""), "base64");
  }
}

if (scan) {
  // Trust the files: whatever mp3 exists for a key becomes the clip, hashed against the current text.
  let found = 0;
  const clips: Manifest["clips"] = {};
  for (const item of items) {
    for (const lang of ["en", "hi"] as Lang[]) {
      const text = (lang === "hi" ? item.voice_hi : item.voice)?.trim();
      const file = `${lang}/${item.key}.mp3`;
      if (!text || !existsSync(join(out, file))) continue;
      clips[item.key] = { ...clips[item.key], [lang]: { file, hash: hashOf(text, VOICES[lang]), chars: text.length, voice: VOICES[lang], model: MODEL } };
      found++;
    }
  }
  manifest.clips = clips;
  mkdirSync(out, { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const missing = items.flatMap((i) => (["en", "hi"] as Lang[]).filter((l) => (l === "hi" ? i.voice_hi : i.voice) && !clips[i.key]?.[l]).map((l) => `${l}/${i.key}`));
  console.log(`✓ manifest: ${found} clips on disk, ${missing.length} lines still without audio${missing.length ? `: ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? "…" : ""}` : ""}`);
  process.exit(0);
}

let planned = 0;
let made = 0;
let skipped = 0;
let chars = 0;
const todo: { item: Item; lang: Lang; text: string; hash: string }[] = [];
for (const item of items) {
  if (only && !only.includes(item.key)) continue;
  for (const lang of langs) {
    const text = (lang === "hi" ? item.voice_hi : item.voice)?.trim();
    if (!text) continue;
    if (text.length > 2500) throw new Error(`${item.key} (${lang}) is ${text.length} chars; the API takes 2,500`);
    const hash = hashOf(text, VOICES[lang]);
    const have = manifest.clips[item.key]?.[lang];
    if (have && have.hash === hash && existsSync(join(out, have.file))) {
      skipped++;
      continue;
    }
    planned++;
    chars += text.length;
    todo.push({ item, lang, text, hash });
  }
}

console.log(`${todo.length} clips to make (${chars.toLocaleString("en-IN")} characters), ${skipped} already current. Voices: en=${VOICES.en} hi=${VOICES.hi}, model ${MODEL}.`);
if (dry || todo.length === 0) process.exit(0);
if (!KEY) {
  console.error("SARVAM_API_KEY is not set. Put it in .env (see .env.example) and run again.");
  process.exit(1);
}

for (const { item, lang, text, hash } of todo) {
  const dir = join(out, lang);
  mkdirSync(dir, { recursive: true });
  const file = `${lang}/${item.key}.mp3`;
  try {
    const mp3 = await synth(text, lang);
    writeFileSync(join(out, file), mp3);
    const prev = manifest.clips[item.key]?.[lang];
    if (prev && prev.file !== file) rmSync(join(out, prev.file), { force: true });
    manifest.clips[item.key] = { ...manifest.clips[item.key], [lang]: { file, hash, chars: text.length, voice: VOICES[lang], model: MODEL } };
    made++;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`  ✓ ${file} (${(mp3.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.error(`  ✗ ${file}: ${(e as Error).message}`);
    if ((e as Error).message.includes("Sarvam 400") || (e as Error).message.includes("Sarvam 403")) process.exit(1);
  }
  await sleep(150);
}
console.log(`✓ ${made}/${planned} clips written to public/audio, manifest updated.`);
