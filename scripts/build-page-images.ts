/**
 * Page-sized copies of the Commons photos: public/images/commons/page/<key>.webp.
 * A book page shows a photo about 700 px wide, and the originals run to 1800 px and several MB.
 * The full photo still loads when a reader opens the event.
 *   bun scripts/build-page-images.ts
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";

const WIDTH = 760;
const QUALITY = 70;

const dir = join(resolve(import.meta.dirname, ".."), "public/images/commons");
const out = join(dir, "page");
mkdirSync(out, { recursive: true });
const manifest: Record<string, { file: string }> = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8"));

let total = 0;
let count = 0;
for (const [key, { file }] of Object.entries(manifest)) {
  const from = join(dir, file);
  if (!existsSync(from)) continue;
  const info = await sharp(from).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(join(out, `${key}.webp`));
  total += info.size;
  count++;
}
console.log(`✓ ${count} page images, ${Math.round(total / 1024 / 1024)} MB in all, ${Math.round(total / count / 1024)} KB each on average`);
