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

See [CONTRIBUTING.md](CONTRIBUTING.md). Good first issues: trace the six approximate outlines (Maurya, Gupta, Tughlaq, Mughal, Company 1805, Raj 1909) from Schwartzberg's atlas, settle a claim from the backlog in `content/VERIFICATION.md`, add a chapter.

## Licences

Code MIT. Content (everything under `content/`) CC BY-SA 4.0. Images carry their own licences; see the manifest.

## For search engines and agents

Every page is static HTML with a canonical URL, Open Graph and Twitter cards, a generated OG image (`/opengraph-image`, `/event/<id>/opengraph-image`) and JSON-LD (`Article` + `Event` with coordinates and dates for events, `CollectionPage` for chapters, `WebSite` on the home page). `/sitemap.xml` and `/robots.txt` are generated at build time.

Every page also has a Markdown twin for agents and offline readers, built by `scripts/build-llms.ts` into `public/`:

| Page | Markdown |
| --- | --- |
| `/` | `/llms.txt` (index) and `/llms-full.txt` (the whole corpus) |
| `/chapter/<id>/` | `/chapter/<id>.md` |
| `/event/<id>/` | `/event/<id>.md` |

Each HTML page links its twin with `<link rel="alternate" type="text/markdown">`, and the index at the foot of the home page lists every `.md`. Set `NEXT_PUBLIC_SITE_URL` (see `.env.example`) so canonical URLs, the sitemap and the Markdown links point at your deployment.

## Narration

Press Play and a narrator reads the story: a prologue over the hero, then one line per chapter opener and per event, in English or Hindi (the speaker icon next to the play controls switches, or turns it off). Lines live in each content file as `voice` and `voice_hi`, and `content/prologue.md` holds the opening. While a line is being read the autoplay paces itself to it; slots without a clip fall back to timed scrolling, and the site works with no audio at all.

Clips are spoken by Sarvam AI (bulbul:v4-flash) and stored in `public/audio/<lang>/<key>.mp3` with `public/audio/manifest.json`:

```sh
SARVAM_API_KEY=... bun run voice        # synthesise what changed (hash of text + voice + model)
bun run voice:scan                      # no API: rebuild the manifest from the mp3s on disk
```

Voices come from `SARVAM_VOICE_EN` and `SARVAM_VOICE_HI` (see `.env.example`); audition at indus.sarvam.ai. Sarvam's text rules apply to the lines: Devanagari for Hindi, `।` to end Hindi sentences, Indian commas in large numbers, short sentences.
