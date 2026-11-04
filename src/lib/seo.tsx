import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import type { Chapter, EpicEvent } from "@/content/schema";
import type { ImageManifest } from "@/content/schema";
import { getImage } from "./content";
import { formatRange, formatYear } from "./format";
import { SITE_URL } from "./site";

export { SITE_URL };
export const SITE_NAME = "indianepics";
const AUTHOR = { "@type": "Person", name: "Saidev Dhal", url: "https://saidev.codes" };
export const SITE_DESCRIPTION =
  "The history of the Indian subcontinent on one map, from the Itihasa to the present day. Every event is dated, placed and sourced, and told in English and Hindi.";

export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
export const eventPath = (id: string) => `/event/${id}/`;
export const chapterPath = (id: string) => `/chapter/${id}/`;
export const eventMarkdown = (id: string) => `/event/${id}.md`;
export const chapterMarkdown = (id: string) => `/chapter/${id}.md`;
/** Absolute URL of a manifest image, for Open Graph and JSON-LD. */
export const absImage = (img: ImageManifest[string]) => abs(`/images/commons/${img.file}`);

/** ISO 8601 year string; negative years are BCE and need the sign and four digits. */
export function isoYear(y: number) {
  const n = Math.abs(y).toString().padStart(4, "0");
  return y < 0 ? `-${n}` : n;
}

export function eventDateLabel(ev: EpicEvent) {
  return ev.date ? formatRange(ev.date) : ev.tradition_date ?? "";
}

/** The first of these cards that exists in public/og. An event added since the last `bun run og` borrows its chapter's. */
export function cardUrl(...cards: string[]) {
  const card = cards.find((c) => existsSync(join(process.cwd(), "public/og", `${c}.jpg`))) ?? "home";
  return abs(`/og/${card}.jpg`);
}

type Share = {
  title: string;
  description: string;
  path: string;
  image: string;
  alt: string;
  article?: { section?: string; tags?: string[] };
};

/** The preview a link shows when it is shared, on every kind of page. */
export function shareTags({ title, description, path, image, alt, article }: Share): Pick<Metadata, "openGraph" | "twitter"> {
  const images = [{ url: image, width: 1200, height: 630, type: "image/jpeg", alt }];
  const kind = article ? { type: "article" as const, ...article } : { type: "website" as const };
  return {
    openGraph: { ...kind, siteName: SITE_NAME, locale: "en_IN", alternateLocale: ["hi_IN"], title, description, url: abs(path), images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: abs(t.path) })),
  };
}

export function reckoningJsonLd(updated: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": abs("/reckoning/"),
    headline: "The reckoning",
    alternativeHeadline: "हिसाब",
    description,
    inLanguage: ["en", "hi"],
    url: abs("/reckoning/"),
    image: abs("/og/reckoning.jpg"),
    dateModified: updated,
    author: AUTHOR,
    publisher: AUTHOR,
    license: "https://creativecommons.org/licenses/by-sa/4.0/",
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
  };
}

/**
 * An article about a moment in history, with its place and years. Not a schema.org Event: Google reads that as a
 * ticketed event the public can book, and asks for prices, performers and an organiser that history does not have.
 */
export function eventJsonLd(ev: EpicEvent, chapter: Chapter | undefined) {
  const img = getImage(ev.image);
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": abs(eventPath(ev.id)),
    headline: ev.title,
    alternativeHeadline: ev.title_hi,
    description: ev.summary,
    inLanguage: ["en", "hi"],
    url: abs(eventPath(ev.id)),
    isPartOf: chapter ? { "@type": "CreativeWorkSeries", name: chapter.title, url: abs(chapterPath(chapter.id)) } : undefined,
    keywords: [...ev.tags, ev.track, ev.location.name].join(", "),
    image: img ? absImage(img) : cardUrl(`event/${ev.id}`, `chapter/${ev.chapter}`),
    author: AUTHOR,
    publisher: AUTHOR,
    license: "https://creativecommons.org/licenses/by-sa/4.0/",
    citation: ev.sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url })),
    spatialCoverage: {
      "@type": "Place",
      name: ev.location.name,
      geo: { "@type": "GeoCoordinates", latitude: ev.location.lat, longitude: ev.location.lng },
    },
    temporalCoverage: ev.date ? (ev.date.start === ev.date.end ? isoYear(ev.date.start) : `${isoYear(ev.date.start)}/${isoYear(ev.date.end)}`) : ev.tradition_date,
  };
  return article;
}

export function chapterJsonLd(ch: Chapter, evs: EpicEvent[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": abs(chapterPath(ch.id)),
    name: ch.title,
    alternateName: ch.title_hi,
    description: ch.kicker ?? (ch.years ? `${formatYear(ch.years.start)} to ${formatYear(ch.years.end)}` : undefined),
    url: abs(chapterPath(ch.id)),
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: evs.length,
      itemListElement: evs.map((e, i) => ({ "@type": "ListItem", position: i + 1, name: e.title, url: abs(eventPath(e.id)) })),
    },
  };
}

export function siteJsonLd(chapters: Chapter[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, creator: AUTHOR, publisher: AUTHOR, description: SITE_DESCRIPTION, inLanguage: ["en", "hi"] },
      {
        "@type": "ItemList",
        name: "Chapters",
        itemListElement: chapters.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.title, url: abs(chapterPath(c.id)) })),
      },
    ],
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
