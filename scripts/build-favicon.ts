/**
 * The site's icons, from the dot mark in src/lib/logo.ts: paper dots on the book's red ink.
 * Red holds up on light and dark browser tabs alike, where paper or ink tiles fade into one of them.
 * Static files, because a generated icon route redirects under trailing slashes and loses its image type.
 *   bun run favicon
 */
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { MARK_COLS, MARK_ROWS, markDots } from "../src/lib/logo";

const RUBRIC = "#97281b";
const PAPER = "#f3ead8";
const CELL = 9.3;
const app = join(resolve(import.meta.dirname, ".."), "src/app");

/** On a 100 unit tile. iOS rounds the corners itself, so the home screen icon asks for none. */
function iconSvg(corner: number) {
  const left = (100 - MARK_COLS * CELL) / 2;
  const top = (100 - MARK_ROWS.length * CELL) / 2;
  const dots = markDots()
    .map((d) => `<circle cx="${(left + (d.x + 0.5) * CELL).toFixed(2)}" cy="${(top + (d.y + 0.5) * CELL).toFixed(2)}" r="${(CELL * 0.46).toFixed(2)}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="${corner}" fill="${RUBRIC}"/><g fill="${PAPER}">${dots}</g></svg>`;
}

const png = (svg: string, size: number) => sharp(Buffer.from(svg), { density: 600 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

/** An .ico is a small directory followed by the images. Every browser since IE 11 reads PNG entries. */
function ico(images: { size: number; data: Buffer }[]) {
  const head = Buffer.alloc(6 + 16 * images.length);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(images.length, 4);
  let offset = head.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + 16 * i;
    head.writeUInt8(size, at);
    head.writeUInt8(size, at + 1);
    head.writeUInt16LE(1, at + 4);
    head.writeUInt16LE(32, at + 6);
    head.writeUInt32LE(data.length, at + 8);
    head.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([head, ...images.map((image) => image.data)]);
}

const tile = iconSvg(20);
writeFileSync(join(app, "icon.svg"), tile);
writeFileSync(join(app, "apple-icon.png"), await png(iconSvg(0), 180));
const sizes = [16, 32, 48];
writeFileSync(join(app, "favicon.ico"), ico(await Promise.all(sizes.map(async (size) => ({ size, data: await png(tile, size) })))));
console.log("✓ favicon.ico, icon.svg, apple-icon.png");
