/**
 * Agent-readable copies of every page: /llms.txt (index), /llms-full.txt (everything),
 * /chapter/<id>.md and /event/<id>.md. Built from src/data after build-content.ts.
 *   bun scripts/build-llms.ts
 */
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const data = join(root, "src/data");
const pub = join(root, "public");
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://indianepics.vercel.app").replace(/\/$/, "");

type Ch = { id: string; title: string; title_hi?: string; kicker?: string; track: string; years?: { start: number; end: number }; stops?: string[]; polity?: string; body: string };
type Ev = {
  id: string; title: string; title_hi?: string; track: string; chapter: string;
  date?: { start: number; end: number; uncertainty?: number; month?: number }; tradition_date?: string; era?: string;
  location: { lat: number; lng: number; name: string }; tags: string[]; summary: string; summary_hi?: string; image?: string;
  sources: { title: string; url?: string; note?: string }[]; body: string;
};
type Img = { title: string; author: string; license: string; licenseUrl?: string; source: string };

const chapters: Ch[] = JSON.parse(readFileSync(join(data, "chapters.json"), "utf8"));
const events: Ev[] = JSON.parse(readFileSync(join(data, "events.json"), "utf8"));
const images: Record<string, Img> = JSON.parse(readFileSync(join(pub, "images/commons/manifest.json"), "utf8"));

const year = (y: number) => (y < 0 ? `${-y} BCE` : `${y} CE`);
const range = (d: NonNullable<Ev["date"]>) => (d.start === d.end ? year(d.start) : `${year(d.start)} – ${year(d.end)}`) + (d.uncertainty ? ` (± ${d.uncertainty} years)` : "");
const when = (e: Ev) => (e.date ? range(e.date) : `${e.tradition_date ?? ""}${e.era ? ` (${e.era})` : ""}`);

function eventMd(e: Ev) {
  const ch = chapters.find((c) => c.id === e.chapter);
  const img = e.image ? images[e.image] : undefined;
  return [
    `# ${e.title}`,
    e.title_hi ? `**${e.title_hi}**` : "",
    "",
    `- Canonical page: ${SITE}/event/${e.id}/`,
    `- Chapter: [${ch?.title ?? e.chapter}](${SITE}/chapter/${e.chapter}.md)`,
    `- Track: ${e.track}${e.track === "tradition" ? " (Itihasa-Purana; told time, not a calendar date)" : " (archaeology and documents)"}`,
    `- When: ${when(e)}`,
    `- Where: ${e.location.name} (${e.location.lat}, ${e.location.lng})`,
    `- Tags: ${e.tags.join(", ")}`,
    "",
    `## Summary`,
    "",
    e.summary,
    e.summary_hi ? `\n${e.summary_hi}` : "",
    "",
    `## Account`,
    "",
    e.body.trim(),
    "",
    `## Sources`,
    "",
    ...e.sources.map((s) => `- ${s.title}${s.url ? ` — ${s.url}` : ""}${s.note ? ` (${s.note})` : ""}`),
    img ? `\n## Image\n\n${img.title}. ${img.author}, ${img.license}${img.licenseUrl ? ` (${img.licenseUrl})` : ""}, via Wikimedia Commons: ${img.source}` : "",
    "",
    `---`,
    `Content licence: CC BY-SA 4.0. Source repository: https://github.com/SkidGod4444/indianepics`,
    "",
  ].join("\n");
}

function chapterMd(c: Ch) {
  const evs = events.filter((e) => e.chapter === c.id);
  return [
    `# ${c.title}`,
    c.title_hi ? `**${c.title_hi}**` : "",
    "",
    `- Canonical page: ${SITE}/chapter/${c.id}/`,
    `- Track: ${c.track}`,
    c.years ? `- Span: ${year(c.years.start)} to ${year(c.years.end)}` : `- Stops: ${(c.stops ?? []).join(", ")}`,
    c.polity ? `- Boundary shown: ${c.polity} (approximate unless marked traced)` : "",
    "",
    c.body.trim(),
    "",
    `## Events (${evs.length})`,
    "",
    ...evs.map((e) => `- ${when(e)} — [${e.title}](${SITE}/event/${e.id}.md): ${e.summary}`),
    "",
  ].join("\n");
}

mkdirSync(join(pub, "event"), { recursive: true });
mkdirSync(join(pub, "chapter"), { recursive: true });
for (const f of ["event", "chapter"]) rmSync(join(pub, f), { recursive: true, force: true }), mkdirSync(join(pub, f), { recursive: true });

for (const e of events) writeFileSync(join(pub, "event", `${e.id}.md`), eventMd(e));
for (const c of chapters) writeFileSync(join(pub, "chapter", `${c.id}.md`), chapterMd(c));

const index = [
  `# indianepics`,
  "",
  `> A scroll-driven historical atlas of the Indian subcontinent from the Itihasa to 2026: ${chapters.length} chapters, ${events.length} dated and sourced events, two tracks (tradition and evidence), English and Hindi, open data (CC BY-SA 4.0).`,
  "",
  `Every page has a Markdown twin at the same path with \`.md\` instead of a trailing slash. The whole corpus is in [llms-full.txt](${SITE}/llms-full.txt). Negative years are BCE. Tradition events carry told time (yugas), never a calendar date; evidence events carry a year range with an honest uncertainty.`,
  "",
  `## Chapters`,
  "",
  ...chapters.map((c) => `- [${c.title}](${SITE}/chapter/${c.id}.md): ${c.kicker ?? ""} (${events.filter((e) => e.chapter === c.id).length} events)`),
  "",
  `## Events`,
  "",
  ...chapters.flatMap((c) => [`### ${c.title}`, "", ...events.filter((e) => e.chapter === c.id).map((e) => `- [${e.title}](${SITE}/event/${e.id}.md): ${e.summary}`), ""]),
  `## Optional`,
  "",
  `- [Source repository](https://github.com/SkidGod4444/indianepics)`,
  `- [Verification log](https://github.com/SkidGod4444/indianepics/blob/main/content/VERIFICATION.md): what was checked, against which sources, and what remains open`,
  `- [Sitemap](${SITE}/sitemap.xml)`,
  "",
].join("\n");
writeFileSync(join(pub, "llms.txt"), index);

const full = [
  index,
  "",
  "---",
  "",
  ...chapters.flatMap((c) => [chapterMd(c), "", ...events.filter((e) => e.chapter === c.id).map(eventMd)]),
].join("\n");
writeFileSync(join(pub, "llms-full.txt"), full);

console.log(`✓ llms.txt, llms-full.txt, ${chapters.length} chapter .md, ${events.length} event .md → public/`);
