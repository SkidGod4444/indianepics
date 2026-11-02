/**
 * Compiles content/ (Markdown + YAML frontmatter) into src/data/*.json.
 * Fails loudly on any invalid file so a bad PR never ships.
 *   bun scripts/build-content.ts [contentDir] [outDir]
 */
import { readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import matter from "gray-matter";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { ChapterSchema, EventSchema, LedgerSchema, PolitySchema, PrologueSchema, type Chapter, type Ledger, type EpicEvent, type Polity } from "../src/content/schema";

const root = resolve(import.meta.dirname, "..");
const contentDir = resolve(process.argv[2] ?? join(root, "content"));
const outDir = resolve(process.argv[3] ?? join(root, "src/data"));
const geoFile = join(root, "public/geo/south-asia.json");

let failures = 0;
function fail(file: string, msg: string) {
  failures++;
  console.error(`\x1b[31m✗ ${file}\x1b[0m\n  ${msg}`);
}

function readMd(dir: string) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const file = join(dir, f);
      const { data, content } = matter(readFileSync(file, "utf8"));
      return { file, data: { ...data, body: content.trim() } };
    });
}

const chapters: Chapter[] = [];
for (const { file, data } of readMd(join(contentDir, "chapters"))) {
  const r = ChapterSchema.safeParse(data);
  if (!r.success) fail(file, r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  "));
  else chapters.push(r.data);
}
chapters.sort((a, b) => a.order - b.order);
const chapterIds = new Set(chapters.map((c) => c.id));

const events: EpicEvent[] = [];
const seen = new Set<string>();
for (const { file, data } of readMd(join(contentDir, "events"))) {
  const r = EventSchema.safeParse(data);
  if (!r.success) {
    fail(file, r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  "));
    continue;
  }
  if (seen.has(r.data.id)) fail(file, `duplicate id ${r.data.id}`);
  if (!chapterIds.has(r.data.chapter)) fail(file, `unknown chapter "${r.data.chapter}"`);
  const ch = chapters.find((c) => c.id === r.data.chapter);
  if (ch && r.data.date && ch.years && (r.data.date.start < ch.years.start || r.data.date.start > ch.years.end)) {
    fail(file, `date.start ${r.data.date.start} is outside chapter "${ch.id}" range ${ch.years.start}..${ch.years.end}`);
  }
  seen.add(r.data.id);
  events.push(r.data);
}
// Evidence events sort by date. Tradition events sort by their era's place in the chapter's stops, then file order.
const stopsOf = new Map(chapters.map((c) => [c.id, c.stops ?? []]));
const sortKey = new Map(
  events.map((e, i) => [
    e.id,
    e.date
      ? e.date.start + ((e.date.month ?? 1) - 1) / 12
      : -1e9 + ((stopsOf.get(e.chapter)?.indexOf(e.era ?? "") ?? -1) + 1) * 1000 + i,
  ]),
);
events.sort((a, b) => (sortKey.get(a.id) ?? 0) - (sortKey.get(b.id) ?? 0));

const polities: Polity[] = [];
const polDir = join(contentDir, "polities");
if (existsSync(polDir)) {
  for (const f of readdirSync(polDir).filter((f) => f.endsWith(".json")).sort()) {
    const file = join(polDir, f);
    const r = PolitySchema.safeParse(JSON.parse(readFileSync(file, "utf8")));
    if (!r.success) fail(file, r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  "));
    else polities.push(r.data);
  }
}

/** Keeps a ring's shape to within `tol` degrees (Douglas-Peucker). The land layer still draws the full outline. */
function thinRing(ring: [number, number][], tol: number): [number, number][] {
  const keep = new Uint8Array(ring.length);
  const far = ring.reduce((best, p, i) => (Math.hypot(p[0] - ring[0][0], p[1] - ring[0][1]) > Math.hypot(ring[best][0] - ring[0][0], ring[best][1] - ring[0][1]) ? i : best), 0);
  keep[0] = keep[far] = keep[ring.length - 1] = 1;
  const stack: [number, number][] = [
    [0, far],
    [far, ring.length - 1],
  ];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = ring[a];
    const [bx, by] = ring[b];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    let worst = -1;
    let dist = tol;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((bx - ax) * (ay - ring[i][1]) - (ax - ring[i][0]) * (by - ay)) / len;
      if (d > dist) {
        dist = d;
        worst = i;
      }
    }
    if (worst >= 0) {
      keep[worst] = 1;
      stack.push([a, worst], [worst, b]);
    }
  }
  return ring.filter((_, i) => keep[i]);
}

/** The Republic's ring carries the hatch and the border morph, and a morph slows with the square of its points. */
const RING_TOLERANCE_DEG = 0.05;

// Modern India outline, following the Survey of India (scripts/india-outline.py): largest ring, used for the Republic chapter.
if (existsSync(geoFile)) {
  const topo = JSON.parse(readFileSync(geoFile, "utf8")) as Topology;
  const objName = Object.keys(topo.objects)[0];
  const fc = feature(topo, topo.objects[objName] as GeometryCollection);
  const india = fc.features.find((f) => (f.properties as { name?: string })?.name === "India");
  if (india) {
    const rings: [number, number][][] =
      india.geometry.type === "Polygon"
        ? [india.geometry.coordinates[0] as [number, number][]]
        : india.geometry.type === "MultiPolygon"
          ? india.geometry.coordinates.map((p) => p[0] as [number, number][])
          : [];
    const largest = rings.sort((a, b) => b.length - a.length)[0];
    if (largest) {
      polities.push({
        id: "india-republic",
        name: "Republic of India",
        name_hi: "भारत गणराज्य",
        year: 1950,
        approximate: false,
        source: "DataMeet india-soi.geojson (CC BY 4.0), following the Survey of India outline, simplified",
        ring: thinRing(largest, RING_TOLERANCE_DEG),
      });
    }
  }
} else {
  console.warn(`! ${geoFile} missing; india-republic polity not generated`);
}

for (const c of chapters) {
  if (c.polity && !polities.some((p) => p.id === c.polity)) fail(`chapters/${c.id}.md`, `unknown polity "${c.polity}"`);
}

if (failures) {
  console.error(`\n${failures} content error(s). Nothing written.`);
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "chapters.json"), JSON.stringify(chapters, null, 2));
writeFileSync(join(outDir, "events.json"), JSON.stringify(events, null, 2));
writeFileSync(join(outDir, "polities.json"), JSON.stringify(polities, null, 2));

// One small file per event: the book fetches its long text, sources and picture credit when the page is opened.
const eventDataDir = join(root, "public/data/event");
rmSync(eventDataDir, { recursive: true, force: true });
mkdirSync(eventDataDir, { recursive: true });
const imageManifest = JSON.parse(readFileSync(join(root, "public/images/commons/manifest.json"), "utf8"));
for (const e of events) {
  const imageEntry = e.image ? imageManifest[e.image] : undefined;
  writeFileSync(join(eventDataDir, `${e.id}.json`), JSON.stringify({ ...e, imageEntry }));
}

// The ledger is optional while it is being written: the page simply leaves it out.
const ledgerFile = join(root, "content/ledger.md");
let ledger: Ledger | null = null;
if (existsSync(ledgerFile)) {
  const r = LedgerSchema.safeParse(matter(readFileSync(ledgerFile, "utf8")).data);
  if (!r.success) {
    console.error(`content/ledger.md\n  ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  ")}`);
    process.exit(1);
  }
  ledger = r.data;
}
writeFileSync(join(outDir, "ledger.json"), JSON.stringify(ledger, null, 2));
writeFileSync(join(root, "public/data/ledger.json"), JSON.stringify(ledger));

// Prologue: spoken over the hero when Play is pressed. Optional file; the build never fails on it.
{
  const file = join(root, "content/prologue.md");
  let prologue: { voice: string; voice_hi?: string } | null = null;
  if (existsSync(file)) {
    const r = PrologueSchema.safeParse(matter(readFileSync(file, "utf8")).data);
    if (!r.success) {
      console.error(`✗ content/prologue.md: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
      process.exit(1);
    }
    prologue = r.data;
  }
  writeFileSync(join(outDir, "prologue.json"), JSON.stringify(prologue, null, 2));
}
console.log(`✓ ${chapters.length} chapters, ${events.length} events, ${polities.length} polities → ${outDir}`);
