/**
 * Writes every dot-matrix glyph in src/lib/glyphs.ts to public/icons/<name>.svg
 * and an index page public/icons/index.html to eyeball them.
 *   bun scripts/gen-icons.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { GLYPHS, glyphToSvg } from "../src/lib/glyphs";

const out = resolve(import.meta.dirname, "../public/icons");
mkdirSync(out, { recursive: true });

for (const g of GLYPHS) {
  writeFileSync(join(out, `${g.name}.svg`), glyphToSvg(g));
}

const tiles = GLYPHS.map(
  (g) => `<figure><img src="./${g.name}.svg" width="112" height="112" alt="${g.title}"><figcaption>${g.name}</figcaption></figure>`,
).join("");
writeFileSync(
  join(out, "index.html"),
  `<!doctype html><meta charset="utf-8"><title>indianepics glyphs</title><style>body{margin:0;background:#15130f;color:#bdb5a6;font:12px/1.4 ui-sans-serif,system-ui;padding:32px;display:flex;flex-wrap:wrap;gap:24px}figure{margin:0;text-align:center}img{display:block;background:#1d1a15;border-radius:12px;padding:12px}</style>${tiles}`,
);

console.log(`✓ ${GLYPHS.length} glyphs → ${out}`);
