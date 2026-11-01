import chaptersJson from "@/data/chapters.json";
import eventsJson from "@/data/events.json";
import politiesJson from "@/data/polities.json";
import manifestJson from "../../public/images/commons/manifest.json";
import type { Chapter, EpicEvent, Polity, ImageManifest } from "@/content/schema";

export const chapters = chaptersJson as Chapter[];
export const events = eventsJson as EpicEvent[];
export const polities = politiesJson as Polity[];
export const images = manifestJson as ImageManifest;

export function getEvent(id: string) {
  return events.find((e) => e.id === id);
}

export function eventsForChapter(chapterId: string) {
  return events.filter((e) => e.chapter === chapterId);
}

export function getPolity(id: string | undefined) {
  return id ? polities.find((p) => p.id === id) : undefined;
}

export function getImage(key: string | undefined) {
  return key ? images[key] : undefined;
}

export function imageSrc(key: string | undefined) {
  const img = getImage(key);
  return img ? `/images/commons/${img.file}` : undefined;
}

/** -261 → "261 BCE", 1526 → "1526". */
export function formatYear(y: number) {
  return y < 0 ? `${-y} BCE` : y < 1000 ? `${y} CE` : `${y}`;
}

export function formatRange(d: { start: number; end: number; uncertainty?: number }) {
  const c = d.uncertainty ? ` ±${d.uncertainty}` : "";
  return d.start === d.end ? `${formatYear(d.start)}${c}` : `${formatYear(d.start)} – ${formatYear(d.end)}${c}`;
}

/** Split a Markdown-ish body into paragraphs. Good enough until MDX lands. */
export function paragraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
