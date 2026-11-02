/**
 * Each chapter sets the room: paper, ink, accent, texture and type.
 * Applied as CSS variables on <html>; everything that reads the tokens follows with a transition.
 * Keyed by chapter id; unknown chapters fall back to their track's default.
 */
import type { BookChapter } from "@/content/schema";

export type Era = {
  id: string;
  vars: Record<string, string>;
  /** Background pattern for the stage, a data URI or "none". */
  pattern: string;
  /** Fraunces axes for the readout and headings. */
  display: { opsz: number; soft: number; weight: number };
};

const svg = (s: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(s)}")`;

const PATTERNS = {
  stars: svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><g fill='#f1e6c8' opacity='0.5'><circle cx='20' cy='30' r='0.8'/><circle cx='120' cy='80' r='1.1'/><circle cx='200' cy='40' r='0.7'/><circle cx='60' cy='160' r='0.9'/><circle cx='170' cy='200' r='1.2'/><circle cx='230' cy='130' r='0.6'/><circle cx='90' cy='220' r='0.8'/></g></svg>`,
  ),
  rock: svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.035' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 0.45 0 0 0 0 0.32 0 0 0 0 0.18 0 0 0 0.22 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  ),
  jaali: svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><g fill='none' stroke='#2f5d50' stroke-opacity='0.08' stroke-width='1'><path d='M24 2 L46 24 L24 46 L2 24 Z'/><circle cx='24' cy='24' r='9'/><path d='M24 0v48M0 24h48'/></g></svg>`,
  ),
  ripples: svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='80'><g fill='none' stroke='#2f416d' stroke-opacity='0.07'><path d='M0 20c20-10 40-10 60 0s40 10 60 0 40-10 60 0M0 60c20-10 40-10 60 0s40 10 60 0 40-10 60 0'/></g></svg>`,
  ),
  brick: svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='20'><g fill='none' stroke='#7a3f22' stroke-opacity='0.12' stroke-width='1'><path d='M0 10h40M0 20h40M20 0v10M0 10v10M40 10v10'/></g></svg>`,
  ),
  coins: svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><g fill='none' stroke='#8a6a1f' stroke-opacity='0.11'><circle cx='16' cy='16' r='9'/><circle cx='48' cy='48' r='9'/><circle cx='16' cy='16' r='3'/><circle cx='48' cy='48' r='3'/></g></svg>`,
  ),
  lattice: svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28'><g fill='none' stroke='#5a3a26' stroke-opacity='0.10' stroke-width='1'><path d='M0 14L14 0L28 14L14 28Z'/></g></svg>`,
  ),
  survey: svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><g fill='none' stroke='#5b4a3a' stroke-opacity='0.10'><path d='M0 .5h60M.5 0v60' stroke-width='1'/><path d='M0 15.5h60M0 30.5h60M0 45.5h60M15.5 0v60M30.5 0v60M45.5 0v60' stroke-width='.5'/></g></svg>`,
  ),
  halftone: svg(
    `<svg xmlns='http://www.w3.org/2000/svg' width='8' height='8'><circle cx='2' cy='2' r='0.6' fill='#1c1915' fill-opacity='0.07'/><circle cx='6' cy='6' r='0.6' fill='#1c1915' fill-opacity='0.07'/></svg>`,
  ),
  none: "none",
};

export const ERAS: Record<string, Era> = {
  // Dawn on the Sarayu: pale saffron paper, old gold, indigo for the told time, ripples under it.
  itihasa: {
    id: "itihasa",
    vars: {
      "--paper": "#eee0c4",
      "--paper-2": "#e7d6b3",
      "--paper-3": "#ddc99e",
      "--ink": "#2e221a",
      "--ink-2": "#4b3e33",
      "--ink-3": "#61584d",
      "--hair": "#d5c298",
      "--evidence": "#785313",
      "--evidence-soft": "#ead5a8",
      "--tradition": "#2f416d",
      "--tradition-soft": "#c6cde3",
      "--water": "#e2d7bc",
      "--land": "#e9dabc",
      "--land-stroke": "#cebc94",
    },
    pattern: PATTERNS.ripples,
    display: { opsz: 144, soft: 100, weight: 400 },
  },
  // Fired brick and river silt: the Indus cities, Vedic fire, the first iron.
  "indus-vedic": {
    id: "indus-vedic",
    vars: {
      "--paper": "#e3d2b2",
      "--paper-2": "#dac5a1",
      "--paper-3": "#cfb78e",
      "--ink": "#2f2218",
      "--ink-2": "#433428",
      "--ink-3": "#5a4f43",
      "--hair": "#c9b28d",
      "--evidence": "#8a341b",
      "--evidence-soft": "#e3bca1",
      "--tradition": "#3a4a7a",
      "--tradition-soft": "#c7cde3",
      "--water": "#d5c9ac",
      "--land": "#dfcdab",
      "--land-stroke": "#c3ac87",
    },
    pattern: PATTERNS.brick,
    display: { opsz: 144, soft: 0, weight: 600 },
  },
  // Sandstone and terracotta: the colour of a rock edict in afternoon light.
  maurya: {
    id: "maurya",
    vars: {
      "--paper": "#e7d7bb",
      "--paper-2": "#decaa7",
      "--paper-3": "#d3bc92",
      "--ink": "#2e1f12",
      "--ink-2": "#483726",
      "--ink-3": "#5f5242",
      "--hair": "#ccb68d",
      "--evidence": "#8f3615",
      "--evidence-soft": "#e8c0a3",
      "--tradition": "#3a4a7a",
      "--tradition-soft": "#c7cde3",
      "--water": "#d8cbaf",
      "--land": "#e2d2b1",
      "--land-stroke": "#c6b18c",
    },
    pattern: PATTERNS.rock,
    display: { opsz: 144, soft: 0, weight: 500 },
  },
  // Gupta gold: cream paper, coin circles, ochre accent, soft classical serif.
  classical: {
    id: "classical",
    vars: {
      "--paper": "#ebddc0",
      "--paper-2": "#e3d3b0",
      "--paper-3": "#d8c69d",
      "--ink": "#2a1e12",
      "--ink-2": "#4c3d2b",
      "--ink-3": "#615745",
      "--hair": "#d1bf98",
      "--evidence": "#705619",
      "--evidence-soft": "#e4d3a1",
      "--tradition": "#3a4a7a",
      "--tradition-soft": "#c7cde3",
      "--water": "#dfd4ba",
      "--land": "#e6d8b8",
      "--land-stroke": "#ccbb94",
    },
    pattern: PATTERNS.coins,
    display: { opsz: 144, soft: 80, weight: 400 },
  },
  // Granite and bronze: Chola stone, Sultanate red sandstone, a temple lattice.
  medieval: {
    id: "medieval",
    vars: {
      "--paper": "#e4d7c0",
      "--paper-2": "#dbccaf",
      "--paper-3": "#cfbd9a",
      "--ink": "#281c14",
      "--ink-2": "#46382a",
      "--ink-3": "#5d5246",
      "--hair": "#ccba99",
      "--evidence": "#7a3a22",
      "--evidence-soft": "#e0bfa8",
      "--tradition": "#3a4a7a",
      "--tradition-soft": "#c7cde3",
      "--water": "#d9d0ba",
      "--land": "#e0d3b8",
      "--land-stroke": "#c4b38e",
    },
    pattern: PATTERNS.lattice,
    display: { opsz: 144, soft: 20, weight: 500 },
  },
  // Marble and lapis: ivory paper, a jaali breathing under it, deep green and gold.
  mughal: {
    id: "mughal",
    vars: {
      "--paper": "#ede2ce",
      "--paper-2": "#e4d7bd",
      "--paper-3": "#dac9a9",
      "--ink": "#20211a",
      "--ink-2": "#3f423c",
      "--ink-3": "#585c55",
      "--hair": "#d3c5a8",
      "--evidence": "#1d6553",
      "--evidence-soft": "#c0d9c7",
      "--tradition": "#2f416d",
      "--tradition-soft": "#c6cde3",
      "--water": "#e0dac8",
      "--land": "#e7dbc4",
      "--land-stroke": "#c9bda1",
    },
    pattern: PATTERNS.jaali,
    display: { opsz: 144, soft: 60, weight: 400 },
  },
  // Ledger paper and sea charts: Company red on buff, ruled lines.
  company: {
    id: "company",
    vars: {
      "--paper": "#e7d8bb",
      "--paper-2": "#decca9",
      "--paper-3": "#d3be95",
      "--ink": "#2c2218",
      "--ink-2": "#443a2e",
      "--ink-3": "#5a5348",
      "--hair": "#cebb96",
      "--evidence": "#8e3724",
      "--evidence-soft": "#e8c2b0",
      "--tradition": "#3a4a7a",
      "--tradition-soft": "#c7cde3",
      "--water": "#dad4bd",
      "--land": "#e3d5b6",
      "--land-stroke": "#c6b68f",
    },
    pattern: PATTERNS.survey,
    display: { opsz: 120, soft: 0, weight: 500 },
  },
  // Sepia and survey paper: the Trigonometrical Survey grid, imperial red.
  raj: {
    id: "raj",
    vars: {
      "--paper": "#e7dac0",
      "--paper-2": "#deceb0",
      "--paper-3": "#d3c19d",
      "--ink": "#2e231a",
      "--ink-2": "#453b2f",
      "--ink-3": "#5b554a",
      "--hair": "#cebe9c",
      "--evidence": "#992e26",
      "--evidence-soft": "#e9bdb1",
      "--tradition": "#3a4a7a",
      "--tradition-soft": "#c7cde3",
      "--water": "#dcd4bd",
      "--land": "#e4d7bb",
      "--land-stroke": "#c8b997",
    },
    pattern: PATTERNS.survey,
    display: { opsz: 96, soft: 0, weight: 500 },
  },
  // Newsprint and the Constitution: clean paper, halftone, saffron and India green.
  republic: {
    id: "republic",
    vars: {
      "--paper": "#eee6d5",
      "--paper-2": "#e4dac6",
      "--paper-3": "#d7ccb5",
      "--ink": "#1e1814",
      "--ink-2": "#47423f",
      "--ink-3": "#5d5d5a",
      "--hair": "#d2c9b5",
      "--evidence": "#984113",
      "--evidence-soft": "#f1c9ad",
      "--tradition": "#2f416d",
      "--tradition-soft": "#c6cde3",
      "--water": "#ded9c9",
      "--land": "#e7dfcd",
      "--land-stroke": "#c8c1af",
    },
    pattern: PATTERNS.halftone,
    display: { opsz: 48, soft: 0, weight: 500 },
  },
};

/** The intro and anything before the story: the base paper from globals.css. */
export const BASE_ERA: Era = {
  id: "base",
  vars: {
    "--paper": "#ebe1cd",
    "--paper-2": "#e0d5bc",
    "--paper-3": "#d3c6a7",
    "--ink": "#27190f",
    "--ink-2": "#4a3c2f",
    "--ink-3": "#6b6050",
    "--hair": "#cdc0a1",
    "--evidence": "#a8460f",
    "--evidence-soft": "#e9c5a4",
    "--tradition": "#2f416d",
    "--tradition-soft": "#c6cde3",
    "--water": "#dad7cb",
    "--land": "#e4dcc6",
    "--land-stroke": "#c8bb9c",
  },
  pattern: PATTERNS.none,
  display: { opsz: 144, soft: 30, weight: 400 },
};

export function eraFor(ch: BookChapter | undefined): Era {
  if (!ch) return BASE_ERA;
  return ERAS[ch.id] ?? (ch.track === "tradition" ? ERAS.itihasa : BASE_ERA);
}

/** Write an era onto <html>. Properties that read the tokens transition in CSS. */
export function applyEra(era: Era) {
  const root = document.documentElement;
  // Base era clears the inline overrides so globals.css (and the opt-in dark block) rule again.
  for (const [k, v] of Object.entries(era.vars)) {
    if (era === BASE_ERA) root.style.removeProperty(k);
    else root.style.setProperty(k, v);
  }
  root.style.setProperty("--era-pattern", era.pattern);
  root.style.setProperty("--display-opsz", String(era.display.opsz));
  root.style.setProperty("--display-soft", String(era.display.soft));
  root.style.setProperty("--display-weight", String(era.display.weight));
  root.dataset.era = era.id;
}
