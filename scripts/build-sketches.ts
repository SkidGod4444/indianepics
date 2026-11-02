/**
 * Traces each chapter's real work into the pen strokes the site draws: source photo, then ink lines (art-lines.py), then
 * ordered strokes (sketch-trace.py), into public/sketch/<id>.txt. Credits live in src/lib/sketches.ts.
 *
 * Traced from named works on purpose. Generated drawings could not be made accurate: a reviewer failed eight of ten.
 *
 *   bun scripts/build-sketches.ts --cache <folder>                 # every sketch
 *   bun scripts/build-sketches.ts --cache <folder> --only hero     # one sketch
 *
 * Settings are tuned per source. Miniatures with painted outlines want a low sigma, plain objects a low eps, and busy
 * photographs a high speck to clear the background. Oil paintings, murals and coins on textured ground trace badly.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { SKETCHES } from "../src/lib/sketches";

type Trace = { from: string; crop?: string; width: number; sigma: number; eps: number; speck: number; smooth?: number };

const local = (key: string) => `public/images/commons/${key}.jpg`;
const thumb = (file: string) => `https://commons.wikimedia.org/w/index.php?title=Special:FilePath/${encodeURIComponent(file)}&width=1800`;

const TRACES: Record<string, Trace> = {
  hero: { from: thumb("Krishna and Arjun on the chariot, Mahabharata, 18th-19th century, India.jpg"), crop: "0.07,0.26,0.93,0.92", width: 1500, sigma: 1.2, eps: 0.012, smooth: 1.2, speck: 45 },
  itihasa: { from: thumb("Bharata meets Rama in Chitrakoot.jpg"), crop: "0.2,0.16,0.99,0.92", width: 1500, sigma: 1.3, eps: 0.016, smooth: 1.2, speck: 45 },
  "indus-vedic": { from: thumb("King Priest, Pakistan.jpg"), crop: "0.1,0,0.92,0.7", width: 1000, sigma: 1.6, eps: 0.012, speck: 40 },
  maurya: { from: local("ashoka-lion-capital"), crop: "0.04,0,0.89,1", width: 900, sigma: 1.6, eps: 0.012, speck: 40 },
  classical: { from: thumb("Buddha in Sarnath Museum (Dhammajak Mutra).jpg"), crop: "0.13,0,0.85,1", width: 1100, sigma: 1.8, eps: 0.014, smooth: 1.2, speck: 80 },
  medieval: { from: local("chola-nataraja"), width: 1000, sigma: 1.4, eps: 0.012, speck: 30 },
  mughal: { from: local("taj-mahal"), width: 1300, sigma: 1.6, eps: 0.014, speck: 40 },
  company: { from: local("plassey"), width: 1300, sigma: 2.2, eps: 0.012, speck: 70 },
  raj: { from: thumb("Mahatma-Gandhi, studio, 1931.jpg"), width: 1100, sigma: 1.8, eps: 0.012, smooth: 1.2, speck: 60 },
  republic: { from: thumb("Jawaharlal Nehru signing the Constitution of India, New Delhi, 24 January 1950.jpg"), width: 1200, sigma: 1.6, eps: 0.014, speck: 40 },
};

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i < 0 ? undefined : process.argv[i + 1];
};
const root = resolve(import.meta.dirname, "..");
const cache = resolve(arg("--cache") ?? join(root, ".sketch-cache"));
const only = arg("--only");
mkdirSync(cache, { recursive: true });

function run(with_: string[], script: string, args: string[]) {
  const deps = with_.flatMap((d) => ["--with", d]);
  const r = spawnSync("uv", ["run", "--no-project", "--python", "3.11", ...deps, script, ...args], { cwd: root, stdio: ["ignore", "ignore", "inherit"] });
  if (r.status !== 0) throw new Error(`${script} failed`);
}

for (const [id, t] of Object.entries(TRACES)) {
  if (only && only !== id) continue;
  if (!SKETCHES[id]) throw new Error(`${id} has no credit in src/lib/sketches.ts`);
  let source = join(root, t.from);
  if (t.from.startsWith("http")) {
    source = join(cache, `${id}.jpg`);
    if (!existsSync(source)) {
      const res = await fetch(t.from, { headers: { "User-Agent": "indianepics/1.0 (https://indianepics.online)" } });
      if (!res.ok) throw new Error(`${id}: ${res.status} from ${t.from}`);
      writeFileSync(source, new Uint8Array(await res.arrayBuffer()));
    }
  }
  const lines = join(cache, `${id}.lines.png`);
  const target = join(root, "public/sketch", `${id}.txt`);
  run(["numpy", "pillow", "scipy"], "scripts/art-lines.py", [source, lines, "--width", String(t.width), "--sigma", String(t.sigma), "--eps", String(t.eps), "--speck", String(t.speck), ...(t.smooth ? ["--smooth", String(t.smooth)] : []), ...(t.crop ? ["--crop", t.crop] : [])]);
  run(["numpy", "pillow", "scipy", "scikit-image"], "scripts/sketch-trace.py", [lines, target]);
  const text = readFileSync(target);
  console.log(`${id}: ${text.toString().split("\n").length - 2} strokes, ${Math.round(statSync(target).size / 1024)} KB, ${Math.round(gzipSync(text).length / 1024)} KB zipped`);
}
