/**
 * Dot-matrix scenes: the chapter illustrations. Same language as the glyphs
 * (faint base grid, lit dots that breathe) but bigger, and drawn in by scroll:
 * every lit dot carries a reveal threshold t in 0..1 and appears when the
 * scene's progress passes it. Layers (1..9 in the mask) reveal in order, and
 * within a layer the light rises from the ground up.
 *
 * Frame: 24 x 14 cells, step 10, so a 240 x 140 viewBox.
 */

export const SCENE_COLS = 24;
export const SCENE_ROWS = 14;
export const SCENE_STEP = 10;
export const SCENE_W = SCENE_COLS * SCENE_STEP;
export const SCENE_H = SCENE_ROWS * SCENE_STEP;
/** Softer than the glyph keyframes: a drawn image should stay readable while it shimmers. */
export const SCENE_KEYFRAMES = "0%{opacity:0.6;}20%{opacity:1;}55%{opacity:0.72;}100%{opacity:0.6;}";

export type SceneDot = { x: number; y: number; t: number; delay: number };
export type Scene = { name: string; title: string; base: { x: number; y: number }[]; lit: SceneDot[]; period: number };

type Order = "rise" | "scan" | "scatter";

const MASKS: Record<string, { title: string; order?: Order; rows: string[] }> = {
  // Night on the Sarayu: stars, then the river, then ghats and a shikhara on the far bank.
  sarayu: {
    title: "Night on the Sarayu",
    order: "scatter",
    rows: [
      "1.....1.........1.....1.",
      "...1.......1........1...",
      ".1.....1.......3........",
      "..........1...333....1..",
      ".....1.......33333......",
      "..............333.......",
      "............3333333.....",
      "...........333333333....",
      "3..........333333333....",
      "33.........333333333....",
      "333........333333333....",
      "3333....................",
      "2.22.22.22.22.22.22.22.2",
      ".22.22.22.22.22.22.22.22",
    ],
  },
  // An edict pillar with its lion capital beside a stupa.
  pillar: {
    title: "Pillar and stupa",
    rows: [
      "........................",
      "..........2.2...........",
      ".........22222..........",
      "..........222...........",
      "...........2............",
      "...........2............",
      "...........2......333...",
      "...........2.....33333..",
      "...........2....3333333.",
      "...........2...333333333",
      "...........2...333333333",
      "...........2...333333333",
      "111111111111111111111111",
      "........................",
    ],
  },
  // A dome over an iwan, flanked by minarets, on a plinth.
  dome: {
    title: "Dome and minarets",
    rows: [
      "...........2............",
      "..........222...........",
      ".........22222..........",
      "........2222222.........",
      ".......222222222........",
      ".......222222222........",
      "..3.....2222222.....3...",
      "..3....111111111....3...",
      "..3....11.....11....3...",
      "..3....11.....11....3...",
      "..3....11.....11....3...",
      "..3....11.....11....3...",
      "..3....111111111....3...",
      "444444444444444444444444",
    ],
  },
  // The chakra: a spoked wheel over the ground line.
  chakra: {
    title: "Chakra",
    order: "scatter",
    rows: [
      "..........222...........",
      "........22.2.22.........",
      ".......2...2...2........",
      "......2.2..2..2.2.......",
      ".....2...2.2.2...2......",
      ".....2....222....2......",
      ".....2222222222222......",
      ".....2....222....2......",
      ".....2...2.2.2...2......",
      "......2.2..2..2.2.......",
      ".......2...2...2........",
      "........22.2.22.........",
      "..........222...........",
      "111111111111111111111111",
    ],
  },
  // The Great Bath in section: steps down to water, brick below, a sun above.
  bath: {
    title: "The Great Bath",
    rows: [
      "....................3...",
      "...................333..",
      "....................3...",
      "111111111111111111111111",
      "1......................1",
      "11....................11",
      "111..................111",
      "1111................1111",
      "11111..............11111",
      "111111.2.2.2.2.2.2.11111",
      "111111222222222222211111",
      "111111111111111111111111",
      "4.4.4.4.4.4.4.4.4.4.4.4.",
      ".4.4.4.4.4.4.4.4.4.4.4.4",
    ],
  },
  // A chaitya window with a small stupa inside, over a row of columns.
  chaitya: {
    title: "Chaitya arch",
    rows: [
      "..........2222..........",
      "........22....22........",
      ".......2........2.......",
      "......2..........2......",
      "......2....33....2......",
      "......2...3333...2......",
      "......2....33....2......",
      "......2....33....2......",
      "......222222222222......",
      "...1..1..1....1..1..1...",
      "...1..1..1....1..1..1...",
      "...1..1..1....1..1..1...",
      "...1..1..1....1..1..1...",
      "111111111111111111111111",
    ],
  },
  // A vimana: the stepped tower of a Chola temple.
  vimana: {
    title: "Vimana",
    rows: [
      "...........33...........",
      "..........3333..........",
      "...........33...........",
      ".........222222.........",
      ".........222222.........",
      "........22222222........",
      "........22222222........",
      ".......2222222222.......",
      ".......2222222222.......",
      "......222222222222......",
      "......222222222222......",
      ".....11111111111111.....",
      ".....11....11....11.....",
      "444444444444444444444444",
    ],
  },
  // An East Indiaman under sail: three masts, hull, a flag, the sea.
  ship: {
    title: "East Indiaman",
    rows: [
      "........................",
      "...........2............",
      "...........22...........",
      "...........2............",
      ".....2.....2.....2......",
      ".....2....333....2......",
      "....333..33333..333.....",
      "...33333.33333.33333....",
      "...33333..333..33333....",
      ".....2.....2.....2......",
      "..111111111111111111....",
      "...1111111111111111.....",
      "....11111111111111......",
      "4.4.4.4.4.4.4.4.4.4.4.4.",
    ],
  },
  // A steam locomotive on its rails, smoke drifting ahead of it.
  locomotive: {
    title: "Locomotive",
    rows: [
      "3.......................",
      "..3.3...................",
      "...3....................",
      "...22...................",
      "...22..........11111....",
      "...22..........1...1....",
      ".111111111111111...1....",
      ".111111111111111...1....",
      ".1111111111111111111111.",
      ".1111111111111111111111.",
      "...22......22......22...",
      "..2222....2222....2222..",
      "...22......22......22...",
      "444444444444444444444444",
    ],
  },
};

function orderKey(order: Order, c: number, r: number) {
  if (order === "scan") return c * SCENE_ROWS + r;
  if (order === "scatter") return (c * 7 + r * 13) % 29;
  return (SCENE_ROWS - 1 - r) * SCENE_COLS + c; // rise: bottom row first, left to right
}

function buildScene(name: string): Scene {
  const m = MASKS[name];
  const order = m.order ?? "rise";
  const base: { x: number; y: number }[] = [];
  const cells: { c: number; r: number; layer: number; key: number }[] = [];
  for (let r = 0; r < SCENE_ROWS; r++) {
    for (let c = 0; c < SCENE_COLS; c++) {
      base.push({ x: c * SCENE_STEP + SCENE_STEP / 2, y: r * SCENE_STEP + SCENE_STEP / 2 });
      const ch = m.rows[r]?.[c] ?? ".";
      if (ch >= "1" && ch <= "9") cells.push({ c, r, layer: Number(ch), key: orderKey(order, c, r) });
    }
  }
  const layers = [...new Set(cells.map((x) => x.layer))].sort((a, b) => a - b);
  const lit: SceneDot[] = [];
  for (const [li, layer] of layers.entries()) {
    const inLayer = cells.filter((x) => x.layer === layer).sort((a, b) => a.key - b.key);
    const n = Math.max(1, inLayer.length - 1);
    for (const [i, cell] of inLayer.entries()) {
      // Layers share the 0..1 range equally; dots spread across their layer's slice.
      const t = (li + i / n) / layers.length;
      lit.push({
        x: cell.c * SCENE_STEP + SCENE_STEP / 2,
        y: cell.r * SCENE_STEP + SCENE_STEP / 2,
        t: Math.round(t * 1000) / 1000,
        delay: cell.c * 140 + cell.r * 40,
      });
    }
  }
  return { name, title: m.title, base, lit, period: 3200 };
}

export const SCENES: Record<string, Scene> = Object.fromEntries(Object.keys(MASKS).map((k) => [k, buildScene(k)]));

/** Chapter → scene. Unknown chapters get a scene by track. */
export function sceneForChapter(id: string, track: string) {
  const byId: Record<string, string> = {
    itihasa: "sarayu",
    "indus-vedic": "bath",
    maurya: "pillar",
    classical: "chaitya",
    medieval: "vimana",
    mughal: "dome",
    company: "ship",
    raj: "locomotive",
    republic: "chakra",
  };
  return byId[id] ?? (track === "tradition" ? "sarayu" : "pillar");
}

/**
 * CSS for scroll-revealed dots. The svg carries --p (progress 0..1), each dot carries --t.
 * Scale does the reveal so the opacity keyframes can keep breathing on top.
 */
export function revealCss(cls: string, period: number, keyframes: string, ease: string) {
  return (
    `.${cls}{fill:currentColor;transform-box:fill-box;transform-origin:center;` +
    `transform:scale(clamp(0,(var(--p,1) - var(--t,0)) * 10,1));` +
    `animation:${cls}k ${period}ms ${ease} infinite both;}` +
    `@keyframes ${cls}k{${keyframes}}` +
    `@media (prefers-reduced-motion:reduce){.${cls}{animation:none;opacity:0.85;transform:none;}}`
  );
}
