import type { BookChapter, BookEvent } from "@/content/schema";
import { formatYear } from "./format";
import { clampUnit, smooth, TURN_SHARE } from "./turn";

/** Where the reader is: chapter index plus progress 0..1 through that chapter. */
export type Position = { chapter: number; progress: number };

export function clamp01(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * A chapter with k events has k+1 slots of equal scroll length:
 * slot 0 is the title, slot i is event i. Returns the slot and the fraction through it.
 */
export function slotAt(progress: number, eventCount: number) {
  const n = eventCount + 1;
  const x = clamp01(progress) * n;
  const slot = Math.min(n - 1, Math.floor(x));
  return { slot, frac: x - slot, slots: n };
}

/** Index of the event that is "now" (-1 during the title slot). */
export function activeIndexAt(progress: number, eventCount: number) {
  return slotAt(progress, eventCount).slot - 1;
}

/** While the year is moving, very old dates step by this much, so the counter never shows a false precision. */
const OLD_YEAR = 10000;
const OLD_YEAR_STEP = 500;

/**
 * The year on the clock. It stands on the date of the page being read, and moves to the next date only while the page
 * turns, so it can never disagree with the page or the voice.
 */
export function yearAt(ch: BookChapter, events: BookEvent[], progress: number): number | null {
  const years = ch.years;
  if (!years) return null;
  const { slot, frac } = slotAt(progress, events.length);
  const dateOf = (s: number) => (s > 0 ? events[s - 1]?.date?.start : undefined) ?? years.start;
  const turned = clampUnit(frac / TURN_SHARE);
  if (slot === 0 || turned >= 1) return dateOf(slot);
  const y = lerp(dateOf(slot - 1), dateOf(slot), smooth(turned));
  // There is no year 0 in this calendar.
  return Math.abs(y) >= OLD_YEAR ? Math.round(y / OLD_YEAR_STEP) * OLD_YEAR_STEP : Math.round(y) || 1;
}

export function readoutAt(ch: BookChapter, events: BookEvent[], progress: number): string {
  const y = yearAt(ch, events, progress);
  if (y !== null) return formatYear(y);
  // Tradition chapters: the clock reads the active pin's own era, not an even split of the stops.
  const idx = activeIndexAt(progress, events.length);
  const era = idx >= 0 ? events[idx].era : undefined;
  return era ?? ch.stops?.[0] ?? ch.title;
}

/** Fraction 0..1 along a rail where chapters have equal width. */
export function positionToFraction(pos: Position, chapterCount: number) {
  return chapterCount ? (pos.chapter + clamp01(pos.progress)) / chapterCount : 0;
}

export function fractionToPosition(f: number, chapterCount: number): Position {
  const x = clamp01(f) * chapterCount;
  const chapter = Math.min(chapterCount - 1, Math.floor(x));
  return { chapter, progress: x - chapter };
}

/** Glyph for an event, from its tags. */
export function glyphFor(ev: BookEvent): string {
  if (ev.track === "tradition") return "diamond";
  const t = new Set(ev.tags);
  if (t.has("science")) return "rocket";
  if (t.has("state-formation")) return "chakra";
  if (t.has("war")) return "fort";
  if (t.has("religion") || t.has("art")) return "stupa";
  if (t.has("colonial") || t.has("trade")) return "river";
  if (t.has("language")) return "scroll";
  return "pillar";
}

export function glyphForChapter(ch: BookChapter): string {
  return (
    (
      {
        itihasa: "diamond",
        "indus-vedic": "river",
        maurya: "pillar",
        classical: "stupa",
        medieval: "fort",
        mughal: "dome",
        company: "river",
        raj: "flag",
        republic: "chakra",
      } as Record<string, string>
    )[ch.id] ?? "wave"
  );
}
