/**
 * Small greyscale plates for the hero. DotPlate only needs an 84×105 grid of brightness, so it reads these
 * rather than the 1800 px originals: the same 4:5 centre crop, at three times the grid, about 1% of the bytes.
 *
 *   bun scripts/build-thumbs.ts
 */
import { mkdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const dir = join(root, "public/images/commons");
const out = join(dir, "thumbs");
mkdirSync(out, { recursive: true });

const manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")) as Record<string, { file: string }>;
const chapters = JSON.parse(readFileSync(join(root, "src/data/chapters.json"), "utf8")) as { image?: string }[];

let bytes = 0;
for (const key of chapters.flatMap((c) => (c.image ? [c.image] : []))) {
  const entry = manifest[key];
  if (!entry) {
    console.error(`no image in the manifest for ${key}`);
    process.exit(1);
  }
  const file = join(out, `${key}.jpg`);
  await sharp(join(dir, entry.file)).resize(252, 315, { fit: "cover" }).greyscale().jpeg({ quality: 72, mozjpeg: true }).toFile(file);
  bytes += statSync(file).size;
}
console.log(`✓ ${chapters.length} hero plates, ${Math.round(bytes / 1024)} KB in all`);
