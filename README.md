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
  ledger.md   the reckoning: every figure sourced, disputed figures as ranges
scripts/
  build-content.ts   content → src/data/*.json and public/data/event/*.json, fails on any invalid file
  build-sketches.ts  traces the ink drawings into public/sketch
  build-paper.py     the shared paper grain tile, public/paper/grain.webp
  fetch-images.ts    Wikimedia Commons → public/images/commons + manifest.json
  gen-icons.ts       glyphs → public/icons/*.svg
src/
  content/schema.ts  the Zod schema; the contract for contributors
  lib/content.ts     every word of the history: server only, a browser import fails the build
  lib/format.ts      dates and paths, safe in the browser
  lib/story.ts       the film: every line laid end to end on one clock
  lib/glyphs.ts      the dot-matrix glyph set (one source for inline + SVG files)
  lib/eras.ts        one palette, texture and type setting per chapter
  components/        Stage (scroll clock + layout), Book, MapStage, EventCallout, DetailOverlay, Ledger, Scrubber, Sketch, DotGlyph, ImageStage
  app/               /, /chapter/[slug], /event/[slug], /reckoning
public/icons/        generated glyph SVGs (bun run icons)
public/geo/          Natural Earth 10m neighbours; India from DataMeet india-soi (CC BY 4.0), Survey of India outline
```

A source that was not read at first hand carries `second_hand: true` and a note saying how it was read. The site tags it on the page, so a figure resting on a citation, an abstract or a press report never looks confirmed. Leave out anything you cannot source at all.

## How it reads

The site is a book. Scrolling down is the clock, and every chapter gets one slot for its title and one per event. Inside each slot the page turn is worked out from the scroll position, so scrolling back un-turns it. A sideways trackpad scroll, the arrow keys and a sideways swipe turn pages too.

Wide screens show a spread: the map is the left page and the event is the right page. Phones show one page, hinged at its left edge, with the map above a card.

Every chapter has its own page material, in CSS under `data-folio`: birch bark, a fired-clay seal frame, sandstone, palm leaf with string holes, a gold Mughal margin, a Company ledger, a gazetteer and the bordered paper of the Constitution. `src/lib/eras.ts` holds the palette for each.

The story can run itself. **Play** drives the book from one clock, the narrator's, so the pages, map and voice stay in step. Any wheel, touch or key hands control back to the reader.

In Play the narrator's clock is the only clock. The page turns over the first third of a slot in 1.3 seconds, whatever the length of the line, and the rest of the slot lasts as long as the voice. A chapter's sketch finishes with its last word and stops when Play stops. The year stands on the date of the page and moves only while the page turns, and the new border spreads while the chapter's first event is read. With the voice off, a page stays up as long as its text takes to read. A scroll too fast to see a turn skips the bend.

A paper sound plays on each turn, quieter under the voice. Browsers keep sound off until the reader clicks, taps or presses a key, so the player shows a small "Tap for sound" until then. Clips are cut from Turning a page by planish and Book paper pages assorted by stephan, from pdsounds.org through Wikimedia Commons, and sit in `public/audio/sfx`.

The book ends with **the reckoning**: the economic record, the drain debate, famines as ranges, what was taken and how the states were drawn. Its data is `content/ledger.md`.

## What the browser receives

The home page carries only what the book shows. An event's long text, sources and picture credit load from `public/data/event/<id>.json` when its page is opened, the reckoning loads from `public/data/ledger.json` as the reader nears it, and the map's code loads once the title page is on screen. `/reckoning/` and every `/event/` and `/chapter/` page stay complete, static HTML for search engines and agents.

## Images and animation

Three kinds of image:

- **Ink drawings** (`public/sketch/`): one per chapter, drawn stroke by stroke on a canvas. Each is traced from a real painting, object or photograph, so what it shows rests on that work. `scripts/build-sketches.ts` holds each source and its settings, `scripts/art-lines.py` finds the ink lines, `scripts/sketch-trace.py` turns them into ordered strokes, and `src/lib/sketches.ts` holds the credits shown on the page. Traces of CC BY and CC BY-SA works carry the same terms.
- **Dot-matrix glyphs** (`src/lib/glyphs.ts`): the small mark beside each event.
- **Photographs** from Wikimedia Commons, author and licence recorded in `public/images/commons/manifest.json`. Flat images get a scroll-linked push-in, drift and reveal in `ImageStage`, which also accepts `layers` (back to front, each with a depth) for parallax when layered art exists.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Good first issues: trace the six approximate outlines (Maurya, Gupta, Tughlaq, Mughal, Company 1805, Raj 1909) from Schwartzberg's atlas, settle a claim from the backlog in `content/VERIFICATION.md`, add a chapter.

## Licences

Code MIT. Content (everything under `content/`) CC BY-SA 4.0. Images carry their own licences; see the manifest.

## For search engines and agents

Every page is static HTML with a canonical URL, Open Graph and Twitter cards, a share card (`public/og/`, drawn by `bun run og` and committed, because Vercel has no Chrome) and JSON-LD (`Article` + `Event` with coordinates and dates for events, `CollectionPage` for chapters, `WebSite` on the home page). `/sitemap.xml` and `/robots.txt` are generated at build time.

Every page also has a Markdown twin for agents and offline readers, built by `scripts/build-llms.ts` into `public/`:

| Page | Markdown |
| --- | --- |
| `/` | `/llms.txt` (index) and `/llms-full.txt` (the whole corpus) |
| `/chapter/<id>/` | `/chapter/<id>.md` |
| `/event/<id>/` | `/event/<id>.md` |

Each HTML page links its twin with `<link rel="alternate" type="text/markdown">`, and the index at the foot of the home page lists every `.md`. `SITE_URL` in `src/lib/site.ts` is the one address that canonical URLs, the sitemap, share cards and the Markdown links all use.

## Narration

Press Play and a narrator reads the story: a prologue over the hero, then one line per chapter opener and per event, in English or Hindi (the speaker icon next to the play controls switches, or turns it off). Lines live in each content file as `voice` and `voice_hi`, and `content/prologue.md` holds the opening. While a line is being read the autoplay paces itself to it; slots without a clip fall back to timed scrolling, and the site works with no audio at all.

Clips are spoken by Sarvam AI (bulbul:v4-flash) and stored in `public/audio/<lang>/<key>.mp3` with `public/audio/manifest.json`:

```sh
SARVAM_API_KEY=... bun run voice        # synthesise what changed (hash of text + voice + model)
bun run voice:scan                      # no API: rebuild the manifest from the mp3s on disk
```

Voices come from `SARVAM_VOICE_EN` and `SARVAM_VOICE_HI` (see `.env.example`); audition at indus.sarvam.ai. Sarvam's text rules apply to the lines: Devanagari for Hindi, `।` to end Hindi sentences, Indian commas in large numbers, short sentences.
