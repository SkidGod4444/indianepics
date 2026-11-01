/**
 * Fonts for the Open Graph images. Satori needs raw TTF data, so at build time we ask Google Fonts
 * for the static TTF (an old user agent gets it) and cache the bytes for the whole build.
 * Offline or blocked, the images fall back to Satori's default sans; the build never fails on it.
 */
const UA = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:1.0) Gecko/20100101 Firefox/1.0";
const FAMILIES = [
  { name: "Fraunces", query: "Fraunces:opsz,wght@9..144,400", weight: 400 as const },
  { name: "Inter", query: "Inter:wght@400", weight: 400 as const },
];

type Font = { name: string; data: ArrayBuffer; weight: 400; style: "normal" };
let cached: Promise<Font[]> | undefined;

async function fetchOne(f: (typeof FAMILIES)[number]): Promise<Font | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${f.query}&display=swap`, { headers: { "User-Agent": UA } }).then((r) => r.text());
    const url = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/)?.[1];
    if (!url) return null;
    const data = await fetch(url).then((r) => r.arrayBuffer());
    return { name: f.name, data, weight: f.weight, style: "normal" };
  } catch {
    return null;
  }
}

export function ogFonts(): Promise<Font[]> {
  cached ??= Promise.all(FAMILIES.map(fetchOne)).then((fs) => fs.filter((f): f is Font => f !== null));
  return cached;
}
