/**
 * Narration: one mp3 per chapter opener, per event and for the prologue, in English and Hindi,
 * spoken by Sarvam AI (bulbul:v4-flash). Written to public/audio/<lang>/<key>.mp3 with a manifest.
 *
 *   SARVAM_API_KEY=... bun scripts/build-voice.ts            # everything that changed
 *   bun scripts/build-voice.ts --only kalinga-war,maurya     # a few keys
 *   bun scripts/build-voice.ts --lang en                      # one language
 *   bun scripts/build-voice.ts --lint                         # no API: flag text the voice will stumble on
 *   bun scripts/build-voice.ts --scan                         # no API: rebuild the manifest from the mp3s on disk (measures pace too)
 *                                                             # (clips made by another tool, e.g. the toonforge MCP)
 *
 * Incremental: each clip is keyed by a hash of text + voice + model, so re-runs only pay for changes.
 * Never part of `bun run build`; the site works without any audio (it falls back to timed scrolling).
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
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
type Clip = { file: string; hash: string; chars: number; voice: string; model: string; seconds?: number };
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
const lint = args.includes("--lint");

/** Length of an mp3 in seconds, via afinfo on macOS or ffprobe elsewhere; undefined when neither is around. */
function secondsOf(file: string): number | undefined {
  try {
    const out = execFileSync("afinfo", [file], { encoding: "utf8" });
    const m = out.match(/estimated duration:\s*([\d.]+)/);
    if (m) return Math.round(Number(m[1]) * 100) / 100;
  } catch {}
  try {
    const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" });
    const n = Number(out.trim());
    if (n > 0) return Math.round(n * 100) / 100;
  } catch {}
  return undefined;
}

/**
 * Things a text-to-speech voice reads wrong: Roman numerals, era abbreviations, circa, en-dash ranges,
 * bare 5+ digit numbers, symbols, slashes, Latin script inside Hindi. Each is a rule with a fix to apply by hand.
 */
const LINT: { re: RegExp; why: string; lang?: Lang }[] = [
  { re: /\b(?=[MDCLXVI]{2,})M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})\b/, why: "Roman numeral: write the number in words (\"Rock Edict thirteen\")" },
  // BCE and CE are read letter by letter, which is how historians say them; AD and BC are not house style.
  { re: /\b(AD|BC)\b/, why: "era abbreviation: use BCE, or drop the era for CE years", lang: "en" },
  { re: /\bc\.\s?\d/, why: "circa: write \"around\"" },
  { re: /\d\s?[–-]\s?\d/, why: "range with a dash: write \"to\"" },
  { re: /(?<![\d,])\d{5,}(?![\d,])/, why: "bare 5+ digit number: add Indian commas (1,00,000)" },
  { re: /[&%\/#@*_<>{}\[\]|~^]/, why: "symbol the voice will spell: write it out" },
  { re: /\d+(st|nd|rd|th)\b/, why: "ordinal suffix: spell the ordinal" },
  { re: /\b\d{3,4}s\b/, why: "decade (1920s): write \"the nineteen-twenties\"" },
  { re: /\b(?:km|kg|mm|cm|sq|no|vs|etc|mr|mrs|dr|st)\./i, why: "abbreviation with a dot: write the word" },
  { re: /[A-Za-z]{3,}/, why: "Latin script in Hindi: use Devanagari", lang: "hi" },
  { re: /[—…\"“”]/, why: "em dash, ellipsis or quotes: use commas and full stops" },
  { re: /\b(?!BCE\b|CE\b)[A-Z]{2,}\b/, why: "all-caps acronym: check it is said as intended (write \"I S R O\" for letters, or the full name)", lang: "en" },
];


type Item = { key: string; voice?: string; voice_hi?: string };
const chapters: Item[] = JSON.parse(readFileSync(join(data, "chapters.json"), "utf8")).map((c: { id: string; voice?: string; voice_hi?: string }) => ({ key: c.id, voice: c.voice, voice_hi: c.voice_hi }));
const events: Item[] = JSON.parse(readFileSync(join(data, "events.json"), "utf8")).map((e: { id: string; voice?: string; voice_hi?: string }) => ({ key: e.id, voice: e.voice, voice_hi: e.voice_hi }));
const prologue = existsSync(join(data, "prologue.json")) ? (JSON.parse(readFileSync(join(data, "prologue.json"), "utf8")) as { voice: string; voice_hi?: string } | null) : null;
const items: Item[] = [...(prologue ? [{ key: "prologue", voice: prologue.voice, voice_hi: prologue.voice_hi }] : []), ...chapters, ...events];

if (lint) {
  let n = 0;
  for (const item of items) {
    for (const lang of ["en", "hi"] as Lang[]) {
      const text = (lang === "hi" ? item.voice_hi : item.voice)?.trim();
      if (!text) continue;
      for (const rule of LINT) {
        if (rule.lang && rule.lang !== lang) continue;
        const m = text.match(rule.re);
        if (m) {
          n++;
          console.log(`${lang}/${item.key}: "${m[0]}" — ${rule.why}`);
        }
      }
    }
  }
  console.log(n ? `${n} lines to fix` : "✓ nothing the voice will stumble on");
  process.exit(n ? 1 : 0);
}

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
  const stale: string[] = [];
  const wrongVoice: string[] = [];
  const clips: Manifest["clips"] = {};
  for (const item of items) {
    for (const lang of ["en", "hi"] as Lang[]) {
      const text = (lang === "hi" ? item.voice_hi : item.voice)?.trim();
      const file = `${lang}/${item.key}.mp3`;
      if (!text || !existsSync(join(out, file))) continue;
      // The synthesiser falls back to a free voice when Sarvam times out, and says so in its .json. Never ship that.
      const report = join(out, `${lang}/${item.key}.json`);
      if (existsSync(report) && JSON.parse(readFileSync(report, "utf8")).provider_used !== "sarvam") {
        wrongVoice.push(`${lang}/${item.key}`);
        continue;
      }
      // A sidecar .txt holds the words that were actually spoken; if the line has changed since, the clip is stale.
      const side = join(out, `${lang}/${item.key}.txt`);
      if (existsSync(side) && readFileSync(side, "utf8").trim() !== text) {
        stale.push(`${lang}/${item.key}`);
        continue;
      }
      clips[item.key] = { ...clips[item.key], [lang]: { file, hash: hashOf(text, VOICES[lang]), chars: text.length, voice: VOICES[lang], model: MODEL, seconds: secondsOf(join(out, file)) } };
      found++;
    }
  }
  manifest.clips = clips;
  mkdirSync(out, { recursive: true });
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const missing = items.flatMap((i) => (["en", "hi"] as Lang[]).filter((l) => (l === "hi" ? i.voice_hi : i.voice) && !clips[i.key]?.[l]).map((l) => `${l}/${i.key}`));
  console.log(`✓ manifest: ${found} clips on disk, ${missing.length} lines still without audio${missing.length ? `: ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? "…" : ""}` : ""}`);
  if (stale.length) console.log(`  ${stale.length} stale (text changed since spoken): ${stale.join(", ")}`);
  if (wrongVoice.length) console.log(`  ${wrongVoice.length} in the fallback voice, left out: ${wrongVoice.join(", ")}`);
  // A local review page: every clip with its words and a player, so a human can listen for names the lint cannot check.
  const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const rows = items
    .map((item) => {
      const cells = (["en", "hi"] as Lang[])
        .map((lang) => {
          const c = clips[item.key]?.[lang];
          const text = (lang === "hi" ? item.voice_hi : item.voice)?.trim() ?? "";
          if (!c) return `<td class="miss">${text ? "no clip yet" : "no line"}</td>`;
          return `<td><audio controls preload="none" src="/audio/${c.file}"></audio><div class="meta">${c.seconds ?? "?"} s · ${(c.chars / (c.seconds || 1)).toFixed(1)} ch/s</div><p${lang === "hi" ? ' lang="hi"' : ""}>${esc(text)}</p></td>`;
        })
        .join("");
      return `<tr><th>${esc(item.key)}</th>${cells}</tr>`;
    })
    .join("\n");
  writeFileSync(
    join(out, "review.html"),
    `<!doctype html><meta charset="utf-8"><title>Narration review</title><style>body{font:14px/1.5 system-ui;margin:24px;color:#1c1915;background:#f4efe5}table{border-collapse:collapse;width:100%}th,td{vertical-align:top;padding:10px;border-top:1px solid #d6cdb8;text-align:left}th{width:160px;font-weight:600}td{width:45%}audio{width:100%}.meta{font-size:12px;color:#8a8275}.miss{color:#8a8275;font-style:italic}p{margin:6px 0 0}</style><h1>Narration review</h1><p>Listen for names and Sanskrit terms. Note the key of anything mispronounced.</p><table><tr><th></th><th>English</th><th>हिन्दी</th></tr>${rows}</table>`,
  );
  console.log("  review page: /audio/review.html (local only)");
  // Pace: characters per second per language, and the clips that stray from the median by more than a quarter.
  for (const lang of ["en", "hi"] as Lang[]) {
    const rows = Object.entries(clips).flatMap(([k, v]) => (v[lang]?.seconds ? [{ k, cps: v[lang]!.chars / v[lang]!.seconds!, s: v[lang]!.seconds! }] : []));
    if (!rows.length) continue;
    const med = rows.map((r) => r.cps).sort((a, b) => a - b)[Math.floor(rows.length / 2)];
    const total = rows.reduce((a, r) => a + r.s, 0);
    const odd = rows.filter((r) => Math.abs(r.cps - med) / med > 0.25);
    console.log(`  pace ${lang}: median ${med.toFixed(1)} chars/s over ${rows.length} clips, ${(total / 60).toFixed(1)} min total${odd.length ? `; off-pace: ${odd.map((r) => `${r.k} (${r.cps.toFixed(1)})`).join(", ")}` : ""}`);
  }
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
