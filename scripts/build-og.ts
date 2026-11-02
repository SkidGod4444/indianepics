/**
 * The pictures a link shows when it is shared: public/og/<path>.jpg, 1200 by 630.
 * The installed Chrome draws them, because the book's paper is CSS. Vercel has no Chrome, so like the voices and the
 * sketches they are made here and committed. An event with no card borrows its chapter's. After changing content:
 *   bun run content && bun run og
 *   bun run og --only maurya     just the pictures whose path contains a word
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, normalize, resolve } from "node:path";
import { geoMercator } from "d3-geo";
import sharp from "sharp";
import { BASE_ERA, ERAS } from "../src/lib/eras";
import { formatRange } from "../src/lib/format";
import { countries, FRAME, pathFor } from "../src/lib/geo";
import { MARK_COLS, MARK_ROWS, markDots } from "../src/lib/logo";
import { SKETCHES } from "../src/lib/sketches";

const WIDTH = 1200;
const HEIGHT = 630;
const QUALITY = 74;
/** The right page, where the plate sits. */
const PLATE = { width: 548, height: 630 };
/** Heavier than the page's pen: a preview is seen at a third of this size. */
const PEN = [0, 2.6, 3.6, 5];
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const root = resolve(import.meta.dirname, "..");
const data = (name: string) => JSON.parse(readFileSync(join(root, "src/data", name), "utf8"));
const chapters = data("chapters.json");
const events = data("events.json");
const ledger = data("ledger.json");
const images = JSON.parse(readFileSync(join(root, "public/images/commons/manifest.json"), "utf8"));
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : "";

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A Commons author field, cut down to a name. */
const byline = (author: string) =>
  author
    .replace(/^No machine-readable author provided\.\s*/, "")
    .replace(/\s*assumed.*$/, "")
    .split(/[.;(]/)[0]
    .trim()
    .slice(0, 46);

function sketchSvg(id: string) {
  const [size, ...rows] = readFileSync(join(root, "public/sketch", `${id}.txt`), "utf8").trim().split("\n");
  const [width, height] = size.split(" ").map(Number);
  const byWeight = new Map<number, string[]>();
  for (const row of rows) {
    const n = row.split(" ").map(Number);
    const pts: [number, number][] = [[n[1], n[2]]];
    for (let i = 3; i < n.length; i += 2) {
      const [x, y] = pts[pts.length - 1];
      pts.push([x + n[i], y + n[i + 1]]);
    }
    const mid = (a: [number, number], b: [number, number]) => `${((a[0] + b[0]) / 2).toFixed(1)} ${((a[1] + b[1]) / 2).toFixed(1)}`;
    let d = `M${pts[0][0]} ${pts[0][1]}L${mid(pts[0], pts[1] ?? pts[0])}`;
    for (let i = 1; i < pts.length - 1; i++) d += `Q${pts[i][0]} ${pts[i][1]} ${mid(pts[i], pts[i + 1])}`;
    (byWeight.get(n[0]) ?? byWeight.set(n[0], []).get(n[0])!).push(d);
  }
  const paths = [...byWeight].map(([w, ds]) => `<path d="${ds.join("")}" stroke-width="${PEN[w]}"/>`).join("");
  return `<svg class="sketch" viewBox="0 0 ${width} ${height}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

function mapSvg(lat: number, lng: number, place: string) {
  const { width, height } = PLATE;
  const projection = geoMercator().fitExtent(
    [
      [26, 54],
      [width - 30, height - 30],
    ],
    FRAME,
  );
  const path = pathFor(projection);
  const [x, y] = projection([lng, lat]) ?? [0, 0];
  const lands = countries.features
    .map((f) => {
      const india = f.properties.name === "India";
      return `<path d="${path(f) ?? ""}" fill="${india ? "var(--land-india)" : "var(--land)"}" stroke="var(--ink-3)" stroke-opacity="${india ? 0.7 : 0.3}" stroke-width="${india ? 1.1 : 0.7}"/>`;
    })
    .join("");
  const west = x > width * 0.55;
  return `<svg class="map" viewBox="0 0 ${width} ${height}">${lands}
    <circle cx="${x}" cy="${y}" r="21" fill="none" stroke="var(--accent)" stroke-opacity=".5"/>
    <circle cx="${x}" cy="${y}" r="9" fill="var(--accent)"/>
    <text x="${x + (west ? -30 : 30)}" y="${y + 9}" text-anchor="${west ? "end" : "start"}" class="pin">${escape(place)}</text>
  </svg>`;
}

function ledgerPlate() {
  const rows = ledger.economy.share as { year: number; gdp: number }[];
  const picked = rows.filter((r) => [1, 1000, 1500, 1700, 1820, 1913, 1950, 2008].includes(r.year));
  const top = Math.max(...picked.map((r) => r.gdp));
  const lines = picked
    .map((r) => `<li><span>${r.year === 1 ? "1 CE" : r.year}</span><i style="width:${(r.gdp / top) * 100}%"></i><b>${r.gdp}%</b></li>`)
    .join("");
  return `<div class="ledger"><p>India's share of the world's output (Maddison)</p><ol>${lines}</ol></div>`;
}

type Card = { file: string; era: string; kicker: string; title: string; date?: string; place?: string; plate: string; credit?: string };

function sketchCredit(id: string) {
  const s = SKETCHES[id];
  if (!s) return undefined;
  return `Traced from ${s.title} · ${s.via} · ${s.license}`;
}

function eventCard(e: (typeof events)[number]): Card {
  const ch = chapters.find((c: { id: string }) => c.id === e.chapter);
  const img = e.image ? images[e.image] : undefined;
  return {
    file: `event/${e.id}`,
    era: e.chapter,
    kicker: ch.title,
    title: e.title,
    date: (e.date ? formatRange(e.date) : e.tradition_date).replace(/\s*±.*$/, ""),
    place: e.location.name,
    plate: img
      ? `<img class="photo" src="/images/commons/page/${e.image}.webp" alt="">`
      : mapSvg(e.location.lat, e.location.lng, e.location.name.split(",")[0]),
    credit: img ? `${byline(img.author)} · ${img.license}` : undefined,
  };
}

function chapterCard(c: (typeof chapters)[number], index: number): Card {
  return {
    file: `chapter/${c.id}`,
    era: c.id,
    kicker: `Chapter ${index + 1}`,
    title: c.title,
    date: c.kicker && c.years ? c.kicker : c.stops?.join(", "),
    plate: sketchSvg(c.id),
    credit: sketchCredit(c.id),
  };
}

const home: Card = {
  file: "home",
  era: "",
  kicker: "From the epics to today",
  title: "The history of India, on one map",
  date: "Every event dated, placed and sourced",
  plate: sketchSvg("hero"),
  credit: sketchCredit("hero"),
};

const reckoning: Card = {
  file: "reckoning",
  era: "company",
  kicker: "The last pages",
  title: "The reckoning",
  date: "Wealth, famines and what was taken",
  plate: ledgerPlate(),
};

function cardHtml(c: Card, stainAt: string) {
  const era = ERAS[c.era] ?? BASE_ERA;
  const v = era.vars;
  const accent = c.era === "itihasa" ? v["--tradition"] : v["--evidence"];
  const vars = [
    `--paper:${v["--paper"]}`,
    `--paper-2:${v["--paper-2"]}`,
    `--ink:${v["--ink"]}`,
    `--ink-2:${v["--ink-2"]}`,
    `--ink-3:${v["--ink-3"]}`,
    `--accent:${accent}`,
    `--stain-at:${stainAt}`,
  ].join(";");
  const rows = MARK_ROWS.length;
  const dots = markDots()
    .map((d) => `<circle cx="${d.x + 0.5}" cy="${d.y + 0.5}" r=".36"/>`)
    .join("");
  const mark = `<svg viewBox="0 0 ${MARK_COLS} ${rows}" height="28" width="${(MARK_COLS / rows) * 28}" fill="currentColor">${dots}</svg>`;
  return `<div class="card" style="${vars}">
    <div class="stack l"></div><div class="stack r"></div>
    <section class="page left"><div class="rule"></div>
      <div class="text">
        <p class="kicker">${escape(c.kicker)}</p>
        <h1 class="title">${escape(c.title)}</h1>
        ${c.date ? `<p class="date">${escape(c.date)}</p>` : ""}
        ${c.place ? `<p class="place">${escape(c.place)}</p>` : ""}
        <p class="brand">${mark}<span>indian<em>epics</em><u>.online</u></span></p>
      </div>
    </section>
    <section class="page right"><div class="rule"></div>
      <figure>${c.plate}${c.credit ? `<figcaption>${escape(c.credit)}</figcaption>` : ""}</figure>
    </section>
  </div>`;
}

const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=block">
<style>
html,body{margin:0;background:#27190f}
.card{position:relative;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;color:var(--ink);font-family:"IM Fell English",serif;
  --land:color-mix(in srgb,var(--paper-2) 72%,var(--ink-3) 10%);--land-india:color-mix(in srgb,var(--paper-2) 62%,var(--accent) 22%)}
.stack{position:absolute;top:0;bottom:0;width:12px;background:repeating-linear-gradient(90deg,rgb(70 44 20/.42) 0 1px,var(--paper-2) 1px 3px)}
.stack.l{left:0}.stack.r{right:0}
.page{position:absolute;top:0;bottom:0;background-color:var(--paper);
  background-image:radial-gradient(ellipse 74% 80% at 50% 48%,transparent 60%,rgb(104 66 24/.11) 84%,rgb(84 50 16/.3) 100%),url(/paper/grain.webp);
  background-size:100% 100%,512px 512px}
.right{background-image:radial-gradient(ellipse 34% 26% at var(--stain-at),rgb(122 80 30/.03),rgb(122 80 30/.045) 74%,rgb(112 70 24/.1) 82%,transparent 87%),
    radial-gradient(ellipse 74% 80% at 50% 48%,transparent 60%,rgb(104 66 24/.11) 84%,rgb(84 50 16/.3) 100%),url(/paper/grain.webp);
  background-size:100% 100%,100% 100%,512px 512px}
.left{left:12px;width:628px}.right{left:640px;right:12px}
.left::after,.right::after{content:"";position:absolute;inset:0;pointer-events:none}
.left::after{background:linear-gradient(to left,rgb(40 24 8/.46),rgb(40 24 8/.18) 2.5%,rgb(40 24 8/.05) 7%,transparent 15%)}
.right::after{background:linear-gradient(to right,rgb(40 24 8/.46),rgb(40 24 8/.18) 2.5%,rgb(40 24 8/.05) 7%,transparent 15%)}
.rule{position:absolute;top:30px;left:44px;right:44px;height:5px;border-top:3px solid var(--ink);border-bottom:1px solid var(--ink);opacity:.62}
.text{position:absolute;inset:60px 58px 38px 50px;display:flex;flex-direction:column}
p{margin:0}
.kicker{font-size:21px;line-height:1.2;letter-spacing:.07em;text-transform:uppercase;color:#97281b;white-space:nowrap}
.title{margin:auto 0 0;font-weight:400;font-size:86px;line-height:1.05;letter-spacing:-.01em;text-wrap:balance}
.date{margin-top:20px;font-size:35px;line-height:1.15;color:var(--accent);text-wrap:balance}
.place{margin-top:6px;font-size:25px;font-style:italic;color:var(--ink-2)}
.brand{margin-top:auto;padding-top:18px;display:flex;align-items:center;gap:11px;font-family:"IM Fell English",serif;font-size:27px;color:var(--accent)}
.brand span{color:var(--ink)}.brand em{font-style:normal;color:var(--accent)}.brand u{text-decoration:none;color:var(--ink-3)}
figure{position:absolute;inset:50px 34px 26px;margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
figcaption{font-size:16px;line-height:1.2;color:var(--ink-3);text-align:center;max-width:100%}
.photo{max-width:100%;max-height:462px;min-height:0;border:7px solid var(--paper-2);outline:1px solid rgb(40 24 8/.36);box-shadow:0 7px 20px rgb(40 24 8/.3);filter:sepia(.14)}
.sketch{width:100%;min-height:0;flex:1;color:var(--ink)}
.right:has(.map) figure{inset:0}.right:has(.map) .rule{display:none}
.map{position:absolute;inset:0;width:100%;height:100%}
.pin{font-size:29px;fill:var(--ink);paint-order:stroke;stroke:var(--paper);stroke-width:6px;stroke-linejoin:round;font-family:"IM Fell English",serif}
.ledger{width:100%;padding:0 10px;box-sizing:border-box}.ledger p{font-size:23px;line-height:1.25;margin-bottom:20px;color:var(--ink-2)}
.ledger ol{list-style:none;margin:0;padding:0;display:grid;gap:13px}
.ledger li{display:grid;grid-template-columns:82px 1fr 76px;align-items:center;gap:12px;font-size:26px}
.ledger li i{display:block;height:17px;background:var(--accent);opacity:.85}
.ledger li span,.ledger li b{font-weight:400;font-family:"IM Fell English",serif}.ledger li b{justify-self:end}
</style></head><body><main id="c"></main>
<script>
window.draw = async (html) => {
  c.innerHTML = html;
  await document.fonts.ready;
  await Promise.all([...c.querySelectorAll("img")].map((i) => i.decode().catch(() => {})));
  const t = c.querySelector(".title");
  const room = t.closest(".text").clientHeight - [...t.closest(".text").children].filter((k) => k !== t).reduce((n, k) => n + k.offsetHeight, 0) - 70;
  let size = 86;
  while (t.offsetHeight > room && size > 38) { size -= 2; t.style.fontSize = size + "px"; }
  const k = c.querySelector(".kicker");
  return { size, fits: t.offsetHeight <= room && k.scrollWidth <= k.clientWidth };
};
</script></body></html>`;

const types: Record<string, string> = { webp: "image/webp", jpg: "image/jpeg", png: "image/png" };
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname));
  if (path === "/") return res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(PAGE);
  const file = join(root, "public", path);
  if (!existsSync(file)) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": types[path.split(".").pop() ?? ""] ?? "application/octet-stream" }).end(readFileSync(file));
});
await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
const { port } = server.address() as AddressInfo;

const profile = mkdtempSync(join(tmpdir(), "og-chrome-"));
const PORT = 9347;
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, "--no-first-run", "--hide-scrollbars", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
let target: { webSocketDebuggerUrl: string } | undefined;
for (let i = 0; i < 60 && !target; i++) {
  await wait(250);
  try {
    const list = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
    target = list.find((t) => t.type === "page");
  } catch {
    // Chrome is still starting.
  }
}
if (!target) throw new Error("Chrome did not start");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let next = 0;
const waiting = new Map<number, (v: Record<string, unknown>) => void>();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data as string);
  if (m.id && waiting.has(m.id)) {
    waiting.get(m.id)!(m.result ?? {});
    waiting.delete(m.id);
  }
};
const cdp = (method: string, params: Record<string, unknown> = {}) =>
  new Promise<Record<string, unknown>>((done) => {
    const id = ++next;
    waiting.set(id, done);
    ws.send(JSON.stringify({ id, method, params }));
  });

await cdp("Page.enable");
await cdp("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
await cdp("Page.navigate", { url: `http://127.0.0.1:${port}/` });
await wait(1500);
await cdp("Runtime.evaluate", {
  expression: `Promise.all([document.fonts.load("74px 'IM Fell English'"),document.fonts.load("italic 25px 'IM Fell English'")])`,
  awaitPromise: true,
});

const cards: Card[] = [home, reckoning, ...chapters.map(chapterCard), ...events.map(eventCard)];

const STAINS = ["84% 90%", "12% 86%", "88% 14%", "16% 12%"];
const todo = cards.filter((c) => !only || c.file.includes(only));
const tight: string[] = [];
let bytes = 0;
let largest = 0;
for (const [i, card] of todo.entries()) {
  const drawn = await cdp("Runtime.evaluate", { expression: `draw(${JSON.stringify(cardHtml(card, STAINS[i % STAINS.length]))})`, awaitPromise: true, returnByValue: true });
  const fit = (drawn.result as { value?: { size: number; fits: boolean } })?.value;
  if (!fit?.fits) tight.push(card.file);
  const shot = await cdp("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 } });
  const file = join(root, "public/og", `${card.file}.jpg`);
  mkdirSync(dirname(file), { recursive: true });
  const saved = await sharp(Buffer.from(shot.data as string, "base64")).jpeg({ quality: QUALITY, mozjpeg: true }).toFile(file);
  bytes += saved.size;
  largest = Math.max(largest, saved.size);
}

ws.close();
chrome.kill();
server.close();
await wait(300);
rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
console.log(`✓ ${todo.length} pictures, ${(bytes / 1024 / 1024).toFixed(1)} MB in all, largest ${Math.round(largest / 1024)} KB`);
if (tight.length) console.log(`  titles that do not fit: ${tight.join(", ")}`);
process.exit(0);
