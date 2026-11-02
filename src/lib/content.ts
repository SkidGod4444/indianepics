import "server-only";
import chaptersJson from "@/data/chapters.json";
import eventsJson from "@/data/events.json";
import politiesJson from "@/data/polities.json";
import prologueJson from "@/data/prologue.json";
import ledgerJson from "@/data/ledger.json";
import manifestJson from "../../public/images/commons/manifest.json";
import type { BookChapter, BookEvent, Chapter, EpicEvent, Ledger, Polity, ImageManifest, Prologue } from "@/content/schema";
import { imagePath, paragraphs } from "./format";

export const chapters = chaptersJson as Chapter[];
export const events = eventsJson as EpicEvent[];
export const polities = politiesJson as Polity[];
export const images = manifestJson as ImageManifest;
export const prologue = prologueJson as Prologue | null;
export const ledger = ledgerJson as Ledger | null;

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
  return img ? imagePath(img) : undefined;
}

/** A page shows a few lines of the first paragraph. Anything past that would only make the HTML heavier. */
const LEAD_CHARS = 340;

function leadOf(body: string) {
  const first = paragraphs(body)[0];
  if (!first || first.length <= LEAD_CHARS) return first;
  return `${first.slice(0, first.lastIndexOf(" ", LEAD_CHARS))}…`;
}

/** What the book needs in the browser. The full text of an event is fetched when its page is opened. */
export function bookEvents(): BookEvent[] {
  return events.map((e) => ({
    id: e.id,
    title: e.title,
    title_hi: e.title_hi,
    track: e.track,
    chapter: e.chapter,
    date: e.date,
    tradition_date: e.tradition_date,
    era: e.era,
    location: e.location,
    tags: e.tags,
    summary: e.summary,
    summary_hi: e.summary_hi,
    image: getImage(e.image) ? e.image : undefined,
    lead: leadOf(e.body),
  }));
}

export function bookChapters(): BookChapter[] {
  return chapters.map((c) => ({
    id: c.id,
    order: c.order,
    title: c.title,
    title_hi: c.title_hi,
    kicker: c.kicker,
    track: c.track,
    years: c.years,
    stops: c.stops,
    polity: c.polity,
    lead: leadOf(c.body),
    lead_hi: c.voice_hi,
  }));
}
