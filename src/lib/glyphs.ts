/**
 * Dot-matrix glyphs: a grid of faint base dots plus "lit" dots that breathe on a
 * staggered schedule. One source of truth for the inline <DotGlyph/> component and
 * for scripts/gen-icons.ts, which writes the same glyphs out as standalone SVG files.
 *
 * Frame: 56x56. 5x5 grid at 6,17,28,39,50 (step 11); 7x7 grid at 4..52 (step 8).
 */

export type Dot = { x: number; y: number; delay: number };
export type Glyph = {
  name: string;
  title: string;
  desc: string;
  grid: 5 | 7;
  /** ms */
  period: number;
  base: Dot[];
  lit: Dot[];
};

export const SIZE = 56;
export const KEYFRAMES = "0%{opacity:0.05;}20%{opacity:1;}55%{opacity:0.18;}100%{opacity:0.05;}";
export const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

function positions(grid: 5 | 7) {
  const step = grid === 5 ? 11 : 8;
  const start = grid === 5 ? 6 : 4;
  return Array.from({ length: grid }, (_, i) => start + i * step);
}

type Program = (col: number, row: number, grid: number) => number | null; // null = not lit

function build(name: string, title: string, desc: string, grid: 5 | 7, period: number, program: Program): Glyph {
  const pos = positions(grid);
  const base: Dot[] = [];
  const lit: Dot[] = [];
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const d: Dot = { x: pos[c], y: pos[r], delay: 0 };
      base.push(d);
      const delay = program(c, r, grid);
      if (delay !== null) lit.push({ x: pos[c], y: pos[r], delay: Math.round(delay) });
    }
  }
  return { name, title, desc, grid, period, base, lit };
}

const mid = (g: number) => (g - 1) / 2;
const dist = (c: number, r: number, g: number) => Math.hypot(c - mid(g), r - mid(g));

/** Shape masks on a 7x7 grid, drawn as strings so they can be read at a glance. */
const SHAPES: Record<string, string[]> = {
  stupa: [
    ".......",
    "...#...",
    "..###..",
    ".#####.",
    "#######",
    "#######",
    ".#####.",
  ],
  pillar: [
    "..###..",
    "...#...",
    "...#...",
    "...#...",
    "...#...",
    "...#...",
    ".#####.",
  ],
  dome: [
    "...#...",
    "..###..",
    ".#####.",
    "#######",
    "#.....#",
    "#.....#",
    "#.....#",
  ],
  fort: [
    "#.#.#.#",
    "#######",
    "#######",
    "#..#..#",
    "#######",
    "#######",
    "#######",
  ],
  flag: [
    "#######",
    "#######",
    "#######",
    "#......",
    "#......",
    "#......",
    "#......",
  ],
  chakra: [
    "...#...",
    ".#.#.#.",
    "..###..",
    "#######",
    "..###..",
    ".#.#.#.",
    "...#...",
  ],
  rocket: [
    "...#...",
    "..###..",
    "..###..",
    "..###..",
    ".#####.",
    "#..#..#",
    "...#...",
  ],
  diamond: [
    "...#...",
    "..###..",
    ".#####.",
    "#######",
    ".#####.",
    "..###..",
    "...#...",
  ],
  river: [
    "##.....",
    ".##....",
    "..##...",
    "...##..",
    "....##.",
    ".....##",
    "......#",
  ],
  scroll: [
    "#######",
    "......#",
    "#######",
    "#......",
    "#######",
    "......#",
    "#######",
  ],
};

function shaped(mask: string[], schedule: Program): Program {
  return (c, r, g) => (mask[r]?.[c] === "#" ? schedule(c, r, g) : null);
}

/** Schedules: how the light travels. */
const wave: Program = (c, r) => c * 480 + r * 48;
const ripple: Program = (c, r, g) => dist(c, r, g) * 320;
const rise: Program = (c, r, g) => (g - 1 - r) * 300 + c * 30;
const scan: Program = (c) => c * 300;
const spin: Program = (c, r, g) => ((Math.atan2(r - mid(g), c - mid(g)) + Math.PI) / (2 * Math.PI)) * 2000;
const fall: Program = (c, r) => r * 300 + c * 30;

export const GLYPHS: Glyph[] = [
  build("wave", "Wave", "A breathing sine wave drifts left to right.", 5, 2400, wave),
  build("ripple", "Ripple", "Light spreads from the centre outward.", 5, 2400, ripple),
  build("rise", "Rise", "Rows light from the bottom up.", 5, 2400, rise),
  build("spin", "Spin", "Light circles the grid.", 5, 2400, spin),
  build("stupa", "Stupa", "A dome on a drum, lit from the base up.", 7, 2600, shaped(SHAPES.stupa, rise)),
  build("pillar", "Pillar", "An edict pillar with its capital, lit from the base up.", 7, 2600, shaped(SHAPES.pillar, rise)),
  build("dome", "Dome", "An arch and dome, lit outward from the centre.", 7, 2600, shaped(SHAPES.dome, ripple)),
  build("fort", "Fort", "Crenellated walls, scanned left to right.", 7, 2600, shaped(SHAPES.fort, scan)),
  build("flag", "Flag", "A flag on a pole, rippling.", 7, 2400, shaped(SHAPES.flag, wave)),
  build("chakra", "Chakra", "A spoked wheel, turning.", 7, 2400, shaped(SHAPES.chakra, spin)),
  build("rocket", "Rocket", "A launch, lit from the base up.", 7, 2200, shaped(SHAPES.rocket, rise)),
  build("diamond", "Diamond", "The tradition marker, pulsing from the centre.", 7, 2400, shaped(SHAPES.diamond, ripple)),
  build("river", "River", "A river line, flowing.", 7, 2400, shaped(SHAPES.river, fall)),
  build("scroll", "Scroll", "Lines of a manuscript, read top to bottom.", 7, 2600, shaped(SHAPES.scroll, fall)),
];

export const glyphByName = Object.fromEntries(GLYPHS.map((g) => [g.name, g])) as Record<string, Glyph>;

/** Standalone SVG string in the house format: white dots, CSS keyframes, reduced-motion fallback. */
export function glyphToSvg(g: Glyph, fill = "#ffffff", idPrefix = `glyph-${g.name}`) {
  const delays = g.lit.map((d, i) => `.${idPrefix}-d${i}{animation-delay:${d.delay}ms;}`).join("");
  const base = g.base.map((d) => `<use href="#${idPrefix}-b" x="${d.x}" y="${d.y}"/>`).join("");
  const lit = g.lit.map((d, i) => `<use class="${idPrefix}-l ${idPrefix}-d${i}" href="#${idPrefix}-l" x="${d.x}" y="${d.y}"/>`).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="${g.title}">` +
    `<title>${g.title}</title><desc>${g.desc}</desc>` +
    `<defs><circle id="${idPrefix}-b" r="2.4" fill="${fill}" opacity="0.07"/><circle id="${idPrefix}-l" r="3.1"/></defs>` +
    `<style>.${idPrefix}-l{fill:${fill};opacity:0;animation:${idPrefix}-k ${g.period}ms ${EASE} infinite both;}` +
    `@keyframes ${idPrefix}-k{${KEYFRAMES}}` +
    `@media (prefers-reduced-motion:reduce){.${idPrefix}-l{animation:none;opacity:0.45;}}${delays}</style>` +
    base +
    lit +
    `</svg>`
  );
}
