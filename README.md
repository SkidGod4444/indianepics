# indianepics

A scroll-driven map of the Indian subcontinent from the Itihasa to today. Scroll moves time; the map, the empires and the pins follow. Open data, open source, built to be extended by pull request.

**Two tracks, one scroll.** The Itihasa-Purana tradition (yugas, Ramayana and Mahabharata geography) and the archaeological record share a map but never a scale. Every event and chapter declares its track. Toggle either off in the UI.

## Run it

```bash
bun install
bun run images   # optional: pulls licence-clean images from Wikimedia Commons
bun run dev      # compiles content/ → src/data, then starts Next
```

`bun run build` writes a fully static site to `out/`. There is no server and no backend.

## Stack

- Next.js 16 (App Router, `output: "export"`), React 19, TypeScript
- Tailwind v4 + shadcn/ui (Radix, Nova preset) for the basic controls
- `motion` for scroll-linked animation, `d3-geo` + `flubber` for the map and boundary morphs
- Content in Markdown + YAML frontmatter, validated with Zod at build time

## Layout

```
content/
  chapters/   one file per chapter: track, years or yuga stops, polity, opening image
  events/     one file per pin: track, date ± uncertainty, lat/lng, tags, sources, body
  polities/   one JSON ring per boundary slice, flagged approximate or traced
scripts/
  build-content.ts   content → src/data/*.json, fails on any invalid file
  fetch-images.ts    Wikimedia Commons → public/images/commons + manifest.json
  gen-icons.ts       glyphs → public/icons/*.svg
src/
  content/schema.ts  the Zod schema; the contract for contributors
  lib/glyphs.ts      the dot-matrix glyph set (one source for inline + SVG files)
  lib/scenes.ts      the scroll-drawn chapter scenes, same dot language, 24x14
  lib/eras.ts        one palette, texture and type setting per chapter
  components/        Stage (scroll clock + layout), MapStage, ChapterTitle, EventCallout, DetailOverlay, Scrubber, DotGlyph, ImageStage
  app/               / and /event/[slug]
public/icons/        generated glyph SVGs (bun run icons)
public/geo/          Natural Earth 10m countries, India point-of-view edition, simplified
```

## How it reads

The map is the stage: centred, full-screen, fixed. Scrolling is the clock. Each chapter gets one scroll "slot" for its title and one per event; as you pass a slot the chapter opener fades, a pin drops, a dotted thread runs on from the last pin, and a card pops up beside it and unfolds as you keep going. Clicking a card grows it in place into the detail view (shared-element transition, `pushState` to `/event/<id>/`, Back closes it). The same `/event/<id>/` is also a prerendered static page for direct links and search.

Every chapter sets its own room. `src/lib/eras.ts` holds a palette, a texture and a type setting per chapter (night indigo for the Itihasa, fired brick for the Indus, sandstone for the Mauryas, Gupta gold, granite and bronze, marble and jaali, ledger paper, survey grid, newsprint); crossing a chapter boundary glides the whole page into it. Each opener is a dot-matrix scene from `src/lib/scenes.ts` that draws itself dot by dot as the title slot scrolls.

The story can run itself: **Play** (bottom right, or the space bar) scrolls at a steady pace, about five seconds per event, and any wheel, touch or key hands control back. Skip back and forward jump one event at a time.

## Images and animation

Two kinds of image:

- **Dot-matrix scenes and glyphs** (`src/lib/scenes.ts`, `src/lib/glyphs.ts`): procedural 56×56 dot grids whose lit dots breathe on a staggered schedule, in the style of an animated icon set. Shapes (stupa, pillar, dome, fort, flag, chakra, rocket, diamond, river, scroll) and schedules (wave, ripple, rise, scan, spin, fall) combine freely. `<DotGlyph name="stupa" />` renders one inline in `currentColor`; `bun run icons` writes them all to `public/icons/*.svg` with an `index.html` gallery.
- **Photographs** from Wikimedia Commons, author and licence recorded in `public/images/commons/manifest.json`. Flat images get a scroll-linked push-in, drift and reveal in `ImageStage`, which also accepts `layers` (back to front, each with a depth) for parallax when layered art exists.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Good first issues: trace the Maurya and Mughal outlines from Schwartzberg's atlas, add a chapter, translate titles to Hindi.

## Licences

Code MIT. Content (everything under `content/`) CC BY-SA 4.0. Images carry their own licences; see the manifest.
