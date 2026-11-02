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
    /** Month of `start` (1-12), only to order events that share a year. */
    month: z.number().int().min(1).max(12).optional(),
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
  /** Not read at first hand: known through another work, an abstract, a summary or a press report. Tagged on the page. */
  second_hand: z.boolean().optional(),
});

/** What a date or claim rests on. Shown on the event page, so a reader can tell a dated inscription from a tradition. */
export const Basis = z.enum(["archaeological", "epigraphic", "textual", "documentary", "traditional"]);
export type Basis = z.infer<typeof Basis>;

/** One claim that needs its own sources. `contested` claims show as a short debate box, as a range, never one number. */
export const Claim = z.object({
  text: z.string().min(1),
  text_hi: z.string().optional(),
  sources: z.array(Source).min(1, "every claim needs a source"),
  contested: z.boolean().default(false),
});
export type Claim = z.infer<typeof Claim>;

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
  basis: Basis.optional(),
  claims: z.array(Claim).optional(),
  /** Narration read aloud in Play mode: a short cinematic voice-over, English. Plain prose, no markup. */
  voice: z.string().optional(),
  /** The same in Hindi, Devanagari script only. */
  voice_hi: z.string().optional(),
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
  /** Narration for the chapter opener in Play mode, English; `voice_hi` is the Hindi twin. */
  voice: z.string().optional(),
  voice_hi: z.string().optional(),
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

/** An event as the book carries it in the browser. The long text and sources load when its page is opened. */
export type BookEvent = Pick<
  EpicEvent,
  "id" | "title" | "title_hi" | "track" | "chapter" | "date" | "tradition_date" | "era" | "location" | "tags" | "summary" | "summary_hi" | "image"
> & { lead?: string };

/** A chapter as the book carries it in the browser. */
export type BookChapter = Pick<Chapter, "id" | "order" | "title" | "title_hi" | "kicker" | "track" | "years" | "stops" | "polity"> & {
  lead?: string;
  lead_hi?: string;
};

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
export type ImageEntry = z.infer<typeof ImageEntry>;
export const ImageManifest = z.record(z.string(), ImageEntry);
export type ImageManifest = z.infer<typeof ImageManifest>;

/** An event in full, with its picture's credit: public/data/event/<id>.json. */
export type FullEvent = EpicEvent & { imageEntry?: ImageEntry };

const Cited = { sources: z.array(Source).min(1, "every entry needs a source") };
const En = z.string().min(1);

/**
 * The reckoning at the end of the book: what India had, what was lost and what was introduced.
 * Disputed figures are ranges with their authors named. Figures that change carry the date they were true on.
 */
export const LedgerSchema = z.object({
  updated: z.string(),
  economy: z.object({
    intro: En,
    intro_hi: En,
    /** Maddison: India's share of world GDP and of world population, in percent. 1990 international dollars only. */
    share: z.array(z.object({ year: z.number().int(), gdp: z.number(), population: z.number().optional() })).min(3),
    /** Broadberry, Custodis and Gupta: India's GDP per head as a percentage of Britain's. */
    per_capita: z.array(z.object({ year: z.number().int(), percent_of_britain: z.number(), approximate: z.boolean().default(false) })).min(2),
    ...Cited,
  }),
  drain: z.object({
    intro: En,
    intro_hi: En,
    positions: z
      .array(
        z.object({
          who: En,
          work: En,
          stance: En,
          stance_hi: En,
          /** True for an op-ed or an advocacy site, so the page can say so. */
          opinion: z.boolean().default(false),
          ...Cited,
        }),
      )
      .min(3),
  }),
  famines: z
    .array(
      z.object({
        name: En,
        name_hi: En,
        years: En,
        region: En,
        region_hi: En,
        /** Excess deaths in millions. */
        low: z.number(),
        high: z.number(),
        central: z.number().optional(),
        central_by: z.string().optional(),
        note: En,
        note_hi: En,
        ...Cited,
      }),
    )
    .min(4),
  artefacts: z
    .array(z.object({ name: En, name_hi: En, taken: En, taken_hi: En, held: En, held_hi: En, note: En, note_hi: En, ...Cited }))
    .min(4),
  repatriation: z.array(z.object({ as_of: En, text: En, text_hi: En, ...Cited })).min(1),
  ledger: z
    .array(z.object({ side: z.enum(["lost", "introduced"]), title: En, title_hi: En, body: En, body_hi: En, ...Cited }))
    .min(6),
  languages: z.object({
    intro: En,
    intro_hi: En,
    facts: z.array(z.object({ label: En, label_hi: En, value: En, value_hi: z.string().optional(), ...Cited })).min(3),
  }),
  /** How today's states and union territories were made, 1947 to the present. */
  states: z.array(z.object({ year: z.number().int(), change: En, change_hi: En, ...Cited })).min(6),
});
export type Ledger = z.infer<typeof LedgerSchema>;

/** The spoken prologue that plays over the hero when the reader presses Play. */
export const PrologueSchema = z.object({
  voice: z.string().min(1),
  voice_hi: z.string().optional(),
});
export type Prologue = z.infer<typeof PrologueSchema>;
