import type { Chapter, EpicEvent } from "@/content/schema";
import type { ImageManifest } from "@/content/schema";
import { formatRange, formatYear, getImage } from "./content";

/** Set NEXT_PUBLIC_SITE_URL at build time; canonical URLs, the sitemap and llms.txt all derive from it. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://indianepics.online").replace(/\/$/, "");
export const SITE_NAME = "indianepics";
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
    image: img ? absImage(img) : undefined,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    license: "https://creativecommons.org/licenses/by-sa/4.0/",
    citation: ev.sources.map((s) => ({ "@type": "CreativeWork", name: s.title, url: s.url })),
    spatialCoverage: {
      "@type": "Place",
      name: ev.location.name,
      geo: { "@type": "GeoCoordinates", latitude: ev.location.lat, longitude: ev.location.lng },
    },
    temporalCoverage: ev.date ? (ev.date.start === ev.date.end ? isoYear(ev.date.start) : `${isoYear(ev.date.start)}/${isoYear(ev.date.end)}`) : ev.tradition_date,
    mainEntity: ev.date
      ? {
          "@type": "Event",
          name: ev.title,
          description: ev.summary,
          startDate: isoYear(ev.date.start),
          endDate: isoYear(ev.date.end),
          location: {
            "@type": "Place",
            name: ev.location.name,
            geo: { "@type": "GeoCoordinates", latitude: ev.location.lat, longitude: ev.location.lng },
          },
        }
      : undefined,
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
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, description: SITE_DESCRIPTION, inLanguage: ["en", "hi"] },
      {
        "@type": "ItemList",
        name: "Chapters",
        itemListElement: chapters.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.title, url: abs(chapterPath(c.id)) })),
      },
    ],
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
