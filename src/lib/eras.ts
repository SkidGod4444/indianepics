/**
 * Each chapter sets the room: paper, ink, accent, texture and type.
 * Applied as CSS variables on <html>; everything that reads the tokens follows with a transition.
 * Keyed by chapter id; unknown chapters fall back to their track's default.
 */
import type { Chapter } from "@/content/schema";

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
  // Night sky over the Sarayu: indigo paper, old gold accent, star dust.
  itihasa: {
    id: "itihasa",
    vars: {
      "--paper": "#1b1f33",
      "--paper-2": "#232842",
      "--paper-3": "#2e3452",
      "--ink": "#f3e9cf",
      "--ink-2": "#cfc4a6",
      "--ink-3": "#8f8870",
      "--hair": "#394064",
      "--evidence": "#e0a64a",
      "--evidence-soft": "#5a4420",
      "--tradition": "#8fa3e6",
      "--tradition-soft": "#2b3660",
      "--water": "#151a2c",
      "--land": "#222741",
      "--land-stroke": "#3a4166",
    },
    pattern: PATTERNS.stars,
    display: { opsz: 144, soft: 100, weight: 400 },
  },
  // Fired brick and river silt: the Indus cities, Vedic fire, the first iron.
  "indus-vedic": {
    id: "indus-vedic",
    vars: {
      "--paper": "#eadcc4",
      "--paper-2": "#dfcdb0",
      "--paper-3": "#d1bc9a",
      "--ink": "#2b211a",
      "--ink-2": "#5f4d3e",
      "--ink-3": "#8e7c6a",
      "--hair": "#c9b596",
      "--evidence": "#9c3b1e",
      "--evidence-soft": "#e7bfa8",
      "--tradition": "#3a4a7a",
      "--tradition-soft": "#c7cde3",
      "--water": "#d9d2bf",
      "--land": "#e4d6bb",
      "--land-stroke": "#c2ad8c",
    },
    pattern: PATTERNS.brick,
    display: { opsz: 144, soft: 0, weight: 600 },
  },
  // Sandstone and terracotta: the colour of a rock edict in afternoon light.
  maurya: {
    id: "maurya",
    vars: {
      "--paper": "#efe3cf",
      "--paper-2": "#e4d4b8",
      "--paper-3": "#d6c29e",
      "--ink": "#2a1d12",
      "--ink-2": "#5e4a35",
      "--ink-3": "#8d7a62",
      "--hair": "#cdb996",
      "--evidence": "#b1431a",
      "--evidence-soft": "#ecc3ab",
      "--tradition": "#3a4a7a",
      "--tradition-soft": "#c7cde3",
      "--water": "#dcd5c3",
      "--land": "#e8dcc3",
      "--land-stroke": "#c6b393",
    },
    pattern: PATTERNS.rock,
    display: { opsz: 144, soft: 0, weight: 500 },
  },
  // Gupta gold: cream paper, coin circles, ochre accent, soft classical serif.
  classical: {
    id: "classical",
    vars: {
      "--paper": "#f3ead6",
      "--paper-2": "#eadfc4",
      "--paper-3": "#ddd0ad",
      "--ink": "#241c12",
      "--ink-2": "#5a4b36",
      "--ink-3": "#8c7d64",
      "--hair": "#d3c5a3",
      "--evidence": "#8a6a1f",
      "--evidence-soft": "#e8d9a8",
      "--tradition": "#3a4a7a",
      "--tradition-soft": "#c7cde3",
      "--water": "#e5e1d1",
      "--land": "#ede4cc",
      "--land-stroke": "#cdbf9c",
    },
    pattern: PATTERNS.coins,
    display: { opsz: 144, soft: 80, weight: 400 },
  },
  // Granite and bronze: Chola stone, Sultanate red sandstone, a temple lattice.
  medieval: {
    id: "medieval",
    vars: {
      "--paper": "#ebe3d5",
      "--paper-2": "#e0d6c2",
      "--paper-3": "#d1c4a9",
      "--ink": "#221a14",
      "--ink-2": "#584838",
      "--ink-3": "#8a7a68",
      "--hair": "#cdbfa5",
      "--evidence": "#7a3a22",
      "--evidence-soft": "#e3c2b0",
      "--tradition": "#3a4a7a",
      "--tradition-soft": "#c7cde3",
      "--water": "#dddbd0",
      "--land": "#e6decb",
      "--land-stroke": "#c3b595",
    },
    pattern: PATTERNS.lattice,
    display: { opsz: 144, soft: 20, weight: 500 },
  },
  // Marble and lapis: ivory paper, a jaali breathing under it, deep green and gold.
  mughal: {
    id: "mughal",
    vars: {
      "--paper": "#f6f1e7",
      "--paper-2": "#ece4d4",
      "--paper-3": "#dfd4bd",
      "--ink": "#17201d",
      "--ink-2": "#4b5450",
      "--ink-3": "#83897f",
      "--hair": "#d5ccb8",
      "--evidence": "#1f6b58",
      "--evidence-soft": "#bfe0d4",
      "--tradition": "#2f416d",
      "--tradition-soft": "#c6cde3",
      "--water": "#e6e8e2",
      "--land": "#eee8da",
      "--land-stroke": "#c9c1ab",
    },
    pattern: PATTERNS.jaali,
    display: { opsz: 144, soft: 60, weight: 400 },
  },
  // Ledger paper and sea charts: Company red on buff, ruled lines.
  company: {
    id: "company",
    vars: {
      "--paper": "#efe4cf",
      "--paper-2": "#e4d6bb",
      "--paper-3": "#d6c5a3",
      "--ink": "#28211a",
      "--ink-2": "#5a5042",
      "--ink-3": "#8a7f6e",
      "--hair": "#cfc0a1",
      "--evidence": "#b0442c",
      "--evidence-soft": "#ecc6b9",
      "--tradition": "#3a4a7a",
      "--tradition-soft": "#c7cde3",
      "--water": "#dfe0d4",
      "--land": "#eae0c9",
      "--land-stroke": "#c6b996",
    },
    pattern: PATTERNS.survey,
    display: { opsz: 120, soft: 0, weight: 500 },
  },
  // Sepia and survey paper: the Trigonometrical Survey grid, imperial red.
  raj: {
    id: "raj",
    vars: {
      "--paper": "#efe6d6",
      "--paper-2": "#e4d9c4",
      "--paper-3": "#d6c9ad",
      "--ink": "#2a231c",
      "--ink-2": "#5c5244",
      "--ink-3": "#8c8272",
      "--hair": "#cfc3a8",
      "--evidence": "#a8322a",
      "--evidence-soft": "#edc0bb",
      "--tradition": "#3a4a7a",
      "--tradition-soft": "#c7cde3",
      "--water": "#e2e0d4",
      "--land": "#ebe3cf",
      "--land-stroke": "#c8bc9f",
    },
    pattern: PATTERNS.survey,
    display: { opsz: 96, soft: 0, weight: 500 },
  },
  // Newsprint and the Constitution: clean paper, halftone, saffron and India green.
  republic: {
    id: "republic",
    vars: {
      "--paper": "#f7f5f0",
      "--paper-2": "#ebe8e0",
      "--paper-3": "#dcd8cd",
      "--ink": "#141414",
      "--ink-2": "#4a4a4a",
      "--ink-3": "#8a8a85",
      "--hair": "#d4d1c8",
      "--evidence": "#e2601c",
      "--evidence-soft": "#f6cdb6",
      "--tradition": "#2f416d",
      "--tradition-soft": "#c6cde3",
      "--water": "#e4e7e4",
      "--land": "#efede6",
      "--land-stroke": "#c8c6bc",
    },
    pattern: PATTERNS.halftone,
    display: { opsz: 48, soft: 0, weight: 500 },
  },
};

/** The intro and anything before the story: the base paper from globals.css. */
export const BASE_ERA: Era = {
  id: "base",
  vars: {
    "--paper": "#f4efe5",
    "--paper-2": "#ebe4d4",
    "--paper-3": "#dfd5bf",
    "--ink": "#1c1915",
    "--ink-2": "#57514a",
    "--ink-3": "#8a8275",
    "--hair": "#d6cdb8",
    "--evidence": "#c2561a",
    "--evidence-soft": "#efc9b2",
    "--tradition": "#2f416d",
    "--tradition-soft": "#c6cde3",
    "--water": "#e3e6e0",
    "--land": "#ece6d8",
    "--land-stroke": "#cfc5ad",
  },
  pattern: PATTERNS.none,
  display: { opsz: 144, soft: 30, weight: 400 },
};

export function eraFor(ch: Chapter | undefined): Era {
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
