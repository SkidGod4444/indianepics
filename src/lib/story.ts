import type { BookChapter, BookEvent } from "@/content/schema";
import { clampUnit, TURN_MS, TURN_SHARE } from "./turn";

/** One beat of the film: the line it speaks and the stretch of the page it plays over. */
export type Cue = {
  /** Clip key, or null for a beat with no voice. */
  key: string | null;
  /** Chapter index, or -1 for the prologue over the hero. */
  chapter: number;
  slot: number;
  slots: number;
  /** When the picture changes, in ms of story time. */
  start: number;
  /** Silence before the voice comes in, while the new picture arrives. */
  lead: number;
  /** How long the voice speaks. */
  voice: number;
};

/** The whole story laid end to end. One clock runs it, so voice and timeline cannot drift apart. */
export type Story = { cues: Cue[]; length: number };

/** Between two lines: the voice comes in as the turning leaf clears the new page. */
const LINE_GAP_MS = 700;
/** Between chapters: the voice waits until the new chapter's page has landed. */
const CHAPTER_GAP_MS = 1100;
/** With the voice off, a page stays up about as long as its words take to read. */
const READ_CHARS_PER_SECOND = 22;
const SILENT_MIN_MS = 6000;
const SILENT_MAX_MS = 18000;

const silentBeat = (text: string) => Math.min(SILENT_MAX_MS, Math.max(SILENT_MIN_MS, (text.length / READ_CHARS_PER_SECOND) * 1000));

export function buildStory(
  chapters: BookChapter[],
  eventsByChapter: Record<string, BookEvent[]>,
  lengthOf: (key: string) => number,
  prologueKey?: string,
): Story {
  const cues: Cue[] = [];
  let at = 0;
  const add = (key: string, chapter: number, slot: number, slots: number, gap: number, text: string) => {
    const spoken = lengthOf(key);
    const lead = spoken && cues.length ? gap : 0;
    const voice = spoken || silentBeat(text);
    cues.push({ key: spoken ? key : null, chapter, slot, slots, start: at, lead, voice });
    at += lead + voice;
  };
  if (prologueKey && lengthOf(prologueKey)) add(prologueKey, -1, 0, 1, 0, "");
  chapters.forEach((c, i) => {
    const events = eventsByChapter[c.id] ?? [];
    const slots = events.length + 1;
    add(c.id, i, 0, slots, CHAPTER_GAP_MS, c.lead ?? "");
    events.forEach((e, j) => add(e.id, i, j + 1, slots, LINE_GAP_MS, `${e.summary} ${e.lead ?? ""}`));
  });
  return { cues, length: at };
}

/**
 * How far through its slot of scrolling a moment of a cue falls. The page turns at its own speed across the first part
 * of the slot, whatever the length of the line, and the rest of the slot lasts as long as the voice does.
 */
export function slotFrac(cue: Cue, t: number) {
  const elapsed = t - cue.start;
  if (elapsed <= TURN_MS) return clampUnit(elapsed / TURN_MS) * TURN_SHARE;
  return TURN_SHARE + (1 - TURN_SHARE) * clampUnit((elapsed - TURN_MS) / (cue.lead + cue.voice - TURN_MS));
}

/** The cue playing at a moment of story time. */
export function cueAt(story: Story, t: number) {
  let lo = 0;
  let hi = story.cues.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (story.cues[mid].start <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** The cue for a place on the page. */
export function cueFor(story: Story, chapter: number, slot: number) {
  const i = story.cues.findIndex((c) => c.chapter === chapter && c.slot === slot);
  return i < 0 ? 0 : i;
}
