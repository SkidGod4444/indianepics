/**
 * Dates, paths and text. This file reaches the browser, so it holds no content: the history itself stays in
 * lib/content.ts on the server, and pages get only the fields they show.
 */
import type { ImageEntry } from "@/content/schema";

/** Commas only from five digits, so 1526 stays a year and 100,000 stays readable. */
const grouped = (n: number) => (n >= 10000 ? n.toLocaleString("en-US") : `${n}`);

/** -261 → "261 BCE", 1526 → "1526". */
export function formatYear(y: number) {
  if (y < 0) return `${grouped(-y)} BCE`;
  return y < 1000 ? `${y} CE` : `${y}`;
}

export function formatRange(d: { start: number; end: number; uncertainty?: number }) {
  const c = d.uncertainty ? ` ±${grouped(d.uncertainty)}` : "";
  if (d.start === d.end) return `${formatYear(d.start)}${c}`;
  // A bare "1000" after a BCE year reads as BCE too, so a range that crosses the era names both ends.
  const end = d.start < 0 && d.end >= 1000 ? `${d.end} CE` : formatYear(d.end);
  return `${formatYear(d.start)} – ${end}${c}`;
}

/** Split a Markdown-ish body into paragraphs. Good enough until MDX lands. */
export function paragraphs(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** The photograph at full size. */
export const imagePath = (image: ImageEntry) => `/images/commons/${image.file}`;

/** The 760 px copy for a book page, from scripts/build-page-images.ts. */
export const pageImagePath = (key: string) => `/images/commons/page/${key}.webp`;
