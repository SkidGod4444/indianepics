import { z } from "zod";

/**
 * Two tracks, one scroll.
 * - evidence: archaeology and documented history, linear year axis.
 * - tradition: Itihasa-Purana (yugas, Ramayana, Mahabharata geography), non-linear axis.
 * Every event and chapter must declare its track.
 */
export const Track = z.enum(["evidence", "tradition"]);
export type Track = z.infer<typeof Track>;

export const Tag = z.enum([
  "political",
  "war",
  "language",
  "religion",
  "colonial",
  "science",
  "trade",
  "art",
  "state-formation",
]);

/** Negative years are BCE: -261 means 261 BCE. Positive years are CE. There is no year 0. */
export const YearRange = z
  .object({
    start: z.number().int(),
    end: z.number().int(),
    /** +/- years. 0 means documented to the year. */
    uncertainty: z.number().int().min(0).default(0),
  })
  .refine((d) => d.end >= d.start, { message: "date.end must be >= date.start" });

export const Location = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  name: z.string().min(1),
});

export const Source = z.object({
  title: z.string().min(1),
  url: z.url().optional(),
  note: z.string().optional(),
});

export const EventSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "kebab-case id"),
  title: z.string().min(1),
  title_hi: z.string().optional(),
  track: Track,
  chapter: z.string().min(1),
  /** Evidence events need a date. Tradition events carry a `tradition_date` label instead. */
  date: YearRange.optional(),
  tradition_date: z.string().optional(),
  /** Tradition events: the yuga the readout should show while this pin is active, e.g. "Dvapara Yuga". */
  era: z.string().optional(),
  location: Location,
  tags: z.array(Tag).min(1),
  summary: z.string().min(1),
  summary_hi: z.string().optional(),
  /** Key into public/images/commons/manifest.json */
  image: z.string().optional(),
  sources: z.array(Source).min(1, "every event needs at least one source"),
  /** Markdown body (compiled from the file body). */
  body: z.string().default(""),
}).superRefine((e, ctx) => {
  if (e.track === "evidence" && !e.date) {
    ctx.addIssue({ code: "custom", message: "evidence events need `date`", path: ["date"] });
  }
  if (e.track === "tradition" && !e.tradition_date) {
    ctx.addIssue({ code: "custom", message: "tradition events need `tradition_date`", path: ["tradition_date"] });
  }
});
export type EpicEvent = z.infer<typeof EventSchema>;

export const ChapterSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  order: z.number().int().min(0),
  title: z.string().min(1),
  title_hi: z.string().optional(),
  kicker: z.string().optional(),
  track: Track,
  /** Evidence chapters map scroll progress linearly onto this range. */
  years: YearRange.optional(),
  /** Tradition chapters show these labels across the scroll instead of years. */
  stops: z.array(z.string()).optional(),
  /** id of a polity polygon in content/polities, drawn and morphed on the map. */
  polity: z.string().optional(),
  /** Key into the commons manifest, used by the chapter's image stage. */
  image: z.string().optional(),
  /** Optional layered art for parallax: back-to-front. Keys into the manifest. */
  layers: z.array(z.object({ image: z.string(), depth: z.number().min(0).max(1) })).optional(),
  body: z.string().default(""),
}).superRefine((c, ctx) => {
  if (c.track === "evidence" && !c.years) {
    ctx.addIssue({ code: "custom", message: "evidence chapters need `years`", path: ["years"] });
  }
  if (c.track === "tradition" && !c.stops?.length) {
    ctx.addIssue({ code: "custom", message: "tradition chapters need `stops`", path: ["stops"] });
  }
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const PolitySchema = z.object({
  id: z.string(),
  name: z.string(),
  name_hi: z.string().optional(),
  year: z.number().int(),
  /** Hand-drawn or traced. Always say which. */
  approximate: z.boolean(),
  source: z.string(),
  /** One outer ring, [lng, lat] pairs, closed. Single ring keeps morphing simple. */
  ring: z.array(z.tuple([z.number(), z.number()])).min(4),
});
export type Polity = z.infer<typeof PolitySchema>;

export const ImageEntry = z.object({
  key: z.string(),
  file: z.string(),
  title: z.string(),
  author: z.string(),
  license: z.string(),
  licenseUrl: z.string().optional(),
  source: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});
export const ImageManifest = z.record(z.string(), ImageEntry);
export type ImageManifest = z.infer<typeof ImageManifest>;
