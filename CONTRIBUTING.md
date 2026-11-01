# Contributing

Everything on the map is a file under `content/`. A contribution is a pull request that adds or edits one. The build validates every file against `src/content/schema.ts` and fails if anything is off, so you get precise errors before review.

## Add an event

1. Copy any file in `content/events/` and rename it to the event's id (kebab-case).
2. Fill the frontmatter. Required: `id`, `title`, `track`, `chapter`, `location`, `tags`, `summary`, `sources`. Evidence events need `date`; tradition events need `tradition_date`.
3. Run `bun run content`. Fix anything it reports.
4. Open a PR.

```yaml
---
id: buxar-1764
title: Battle of Buxar
title_hi: बक्सर का युद्ध
track: evidence
chapter: mughal
date: { start: 1764, end: 1764, uncertainty: 0 }
location: { lat: 25.56, lng: 83.98, name: Buxar, Bihar }
tags: [war, colonial]
summary: One sentence that could stand alone on a pin.
image: optional-key-from-the-image-manifest
sources:
  - { title: "A book or paper", url: "https://..." }
---
Body paragraphs, plain Markdown. Say what is contested and cite it.
```

Rules of thumb:

- Negative years are BCE: `-261` is 261 BCE. There is no year 0.
- `uncertainty` is honest, not decorative. A conventional date gets ±3 or more.
- Every event has at least one source. Primary or standard scholarly, with a URL when one exists.
- Tradition events are welcome and belong on the tradition track with a `tradition_date` label. They never get a numeric `date`.

## Add a chapter

Create `content/chapters/NN-id.md` with `order`, `track`, `years` (evidence) or `stops` (tradition), and optionally `polity` and `image`. Events reference the chapter by id. The build rejects events dated outside their chapter's range.

## Boundaries

`content/polities/*.json` holds one outer ring per slice as `[lng, lat]` pairs. Six rings (Maurya, Gupta, Tughlaq, Mughal, Company 1805, Raj 1909) are hand-drawn approximations and flagged `approximate: true`. The best contribution right now is to trace them properly from Schwartzberg's *Historical Atlas of South Asia* (free at DSAL, University of Chicago) and from Wikimedia Commons historical maps, keeping the flag honest. Keep rings to one polygon with no holes so the morph stays simple.

Modern boundaries come from Natural Earth's India point-of-view edition. Anything published for an Indian audience should respect Indian law on map boundaries.

## Images

Run `bun run images` after adding a key and query to `scripts/fetch-images.ts`. Only PD, CC0, CC BY and CC BY-SA are accepted, and the manifest records author, licence and source for every file. Do not commit images without a manifest entry.

Layered art (separate sky, land and subject files) animates far better than a single photo. `ImageStage` already parallaxes `layers` on event detail pages; wiring chapter `layers` into the chapter opener is an open task, so for now add layered art to events.

The dot-matrix glyphs in `src/lib/glyphs.ts` are the house illustration style: add a 7×7 shape mask and a schedule, run `bun run icons`, and map it in `glyphFor`.

## Verifying content

Every claim gets checked. `.claude/agents/content-verifier.md` is the brief for the historian-editor agent that fact-checks dates, coordinates, names and sources, fixes them in place and tightens the copy; run it over any content change before opening a pull request ("run content-verifier on content/events/<id>.md"). Keep its habits by hand too: a date range with honest `uncertainty` beats false precision, tradition events never get a numeric date, and every contested point is said to be contested.

## Eras and scenes

A new chapter needs three code touches: a palette in `src/lib/eras.ts` (paper, ink, accent, texture, type axes), a 24x14 scene mask in `src/lib/scenes.ts` (digits are reveal layers, lower digits draw first) and a glyph in `glyphForChapter`. Chapters without an entry fall back to the base paper and a generic scene, so content can land before the art does.

## Translations

Every `title` and `summary` has an optional `_hi` sibling. Add them. The schema is open to more languages; propose a code before adding a third.

## Code

`bun install`, `bun run dev`. TypeScript strict, Tailwind v4, shadcn/ui for basic controls. Keep the map in SVG until polygon counts force Canvas.
