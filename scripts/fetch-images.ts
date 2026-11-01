/**
 * Pulls licence-clean images from Wikimedia Commons into public/images/commons/
 * and writes manifest.json with author + licence + source for every file.
 * Only PD / CC0 / CC BY / CC BY-SA are accepted.
 *   bun scripts/fetch-images.ts
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { ImageManifest } from "../src/content/schema";

const root = resolve(import.meta.dirname, "..");
const outDir = join(root, "public/images/commons");
const manifestFile = join(outDir, "manifest.json");
const UA = "indianepics/0.1 (https://github.com/saidevdhal/indianepics; open-source history atlas)";

/** key → Commons search query. Keep keys stable; content files reference them. */
const WANTED: Record<string, string> = {
  "sanchi-stupa": "Sanchi Great Stupa gateway",
  "ashoka-lion-capital": "Lion Capital of Ashoka Sarnath",
  "dhauli-edict": "Dhauli rock edict elephant",
  "girnar-edict": "Girnar Ashoka rock edict",
  "taxila-ruins": "Taxila Sirkap ruins",
  "babur-panipat": "Battle of Panipat 1526 Baburnama miniature",
  "fatehpur-sikri": "Buland Darwaza Fatehpur Sikri",
  "taj-mahal": "Taj Mahal Agra",
  "raigad-fort": "Raigad fort Maharashtra",
  "golconda-fort": "Golconda fort Hyderabad",
  "plassey": "Battle of Plassey painting Francis Hayman",
  "anandpur-sahib": "Takht Sri Keshgarh Sahib Anandpur",
  "red-fort": "Red Fort Delhi Lahori Gate",
  "nehru-tryst": "Jawaharlal Nehru 1947 tryst with destiny",
  "wagah-border": "Wagah border ceremony",
  "parliament-house-delhi": "Sansad Bhavan Parliament House New Delhi",
  "wheat-punjab": "Wheat field Punjab India",
  "charminar": "Charminar Hyderabad",
  "pangong-ladakh": "Pangong Tso Ladakh",
  "ram-ki-paidi-ayodhya": "Ram ki Paidi Ayodhya Sarayu",
  "brahma-sarovar-kurukshetra": "Brahma Sarovar Kurukshetra",
  "dwarkadhish-temple": "Dwarkadhish Temple Gujarat",
  "gateway-of-india": "Gateway of India Mumbai",
  // indus-vedic
  "indus-unicorn-seal": "Indus Valley unicorn seal",
  "mohenjo-daro": "Mohenjo-daro Great Bath",
  "dholavira": "Dholavira Harappan site Kutch",
  "lothal-dock": "Lothal dockyard",
  "harappa-ruins": "Harappa archaeological site ruins",
  "rigveda-manuscript": "Rigveda Sanskrit manuscript 19th century",
  "painted-grey-ware": "Painted Grey Ware pottery",
  "rajgir-cyclopean-wall": "Cyclopean Wall Rajgir",
  "dhamek-stupa": "Dhamek Stupa Sarnath",
  // classical
  "ajanta-padmapani": "Ajanta Cave 1 Padmapani",
  "nashik-pandavleni": "Pandavleni caves Nashik",
  "kanishka-statue": "Kanishka headless statue",
  "sangam-keeladi": "Keezhadi archaeological site",
  "gupta-coin-kumaradevi": "Chandragupta Kumaradevi coin",
  "allahabad-pillar": "Allahabad pillar Samudragupta",
  "ajanta-caves": "Ajanta caves panorama",
  "aryabhata-statue": "Aryabhata statue IUCAA",
  "nalanda-ruins": "Nalanda mahavihara ruins",
  "harsha-coin": "Harshavardhana coin",
  "shore-temple": "Shore Temple Mamallapuram",
  // medieval
  "chola-nataraja": "Chola bronze Nataraja",
  "brihadisvara-thanjavur": "Thanjavur Big Temple",
  "gangaikonda-temple": "Gangaikonda Cholapuram",
  "kandariya-mahadeva": "Kandariya Mahadeva Temple west",
  "somnath-temple": "Somnath temple Prabhas Patan",
  "qutb-minar": "Qutb Minar Delhi",
  "chittorgarh-fort": "Chittorgarh fort",
  "daulatabad-fort": "Daulatabad fort Chand Minar",
  "hampi-virupaksha": "Virupaksha Temple Hampi",
  "gulbarga-fort-mosque": "Gulbarga fort mosque",
  "timur-zafarnama": "Timur defeats Sultan of Delhi Zafarnama",
  // company
  "diwani-clive": "Shah Alam conveying the grant of the Diwani to Lord Clive",
  "hector-munro": "Battle of Buxar",
  "warren-hastings": "Warren Hastings Tilly Kettle",
  "storming-seringapatam": "Storming of Seringapatam",
  "william-lambton": "Lambton Great Trigonometrical Survey",
  "vellore-fort": "Vellore Fort moat",
  "shaniwar-wada": "Shaniwar Wada Pune",
  "rammohun-roy": "Ram Mohan Roy portrait",
  "battle-of-meeanee": "Battle of Meeanee 1843",
  "duleep-singh": "Maharaja Duleep Singh Winterhalter",
  "cst-mumbai": "Chhatrapati Shivaji Terminus Mumbai",
  "kunwar-singh": "Kunwar Singh",
  "lucknow-residency": "Lucknow Residency ruins",
  "slaughter-ghat-cawnpore": "Satichaura Ghat Kanpur",
  "bahadur-shah-zafar": "Bahadur Shah Zafar photograph 1858",
  "jhansi-fort": "Jhansi Fort",
  // republic
  "ballot-boxes-1952": "1951 India general election",
  "tawang-monastery": "Tawang Monastery",
  "surrender-dhaka-1971": "Surrender of Pakistan 1971 Niazi Aurora",
  "bhopal-carbide": "Union Carbide Bhopal plant",
  "kargil-war-memorial": "Kargil War Memorial Drass",
  "ram-mandir-ayodhya": "Ram Mandir Ayodhya",
  "pahalgam-valley": "Pahalgam valley",
  // raj
  "victoria-memorial": "Victoria Memorial Kolkata",
  "queens-proclamation-1858": "Queen's Proclamation 1858",
  "madras-famine-1877": "Madras famine 1877",
  "congress-1885": "First session Indian National Congress 1885",
  "birsa-munda-statue": "Birsa Munda statue",
  "calcutta-town-hall": "Town Hall Kolkata",
  "muslim-league-1906": "All India Muslim League 1906 Dhaka",
  "khudiram-bose": "Khudiram Bose",
  "cellular-jail": "Cellular Jail Port Blair",
  "delhi-durbar-1911": "Delhi Durbar 1911",
  "komagata-maru": "Komagata Maru 1914 Vancouver",
  "champaran-1917": "Champaran Satyagraha",
  "jallianwala-bagh": "Jallianwala Bagh 1919",
  "chauri-chaura": "Chauri Chaura memorial",
  "alluri-statue": "Alluri Sitarama Raju",
  "vaikom-temple": "Vaikom Mahadeva Temple",
  "mahad-krantibhoomi": "Chavdar Tale Mahad",
  "bhagat-singh": "Bhagat Singh 1929",
  "salt-march": "Gandhi Salt March 1930",
  "surya-sen": "Surya Sen",
  "poona-pact-1932": "Poona Pact 1932",
  "quit-india-1942": "August Kranti Maidan",
  "bengal-famine-1943": "Bengal famine 1943",
  "bose-ina": "Subhas Chandra Bose Indian National Army",
  "simla-conference-1945": "Simla Conference 1945",
  "calcutta-riots-1946": "Calcutta riots 1946",
};

const OK_LICENSE = /^(public domain|pd|cc0|cc[- ]by(?:[- ]sa)?(?:[- ]\d(?:\.\d)?)?(?:[- ][a-z]{2})?)$/i;

type ImageInfo = {
  url: string;
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  mime: string;
  extmetadata?: Record<string, { value: string }>;
};
type Page = { title: string; imageinfo?: ImageInfo[] };

async function search(query: string): Promise<Page[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: "6",
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "1800",
    iiextmetadatafilter: "LicenseShortName|Artist|ImageDescription|ObjectName|LicenseUrl|Credit",
    origin: "*",
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Commons ${res.status} for "${query}"`);
  const json = (await res.json()) as { query?: { pages?: Record<string, Page> } };
  return Object.values(json.query?.pages ?? {});
}

function strip(html: string | undefined) {
  return (html ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

mkdirSync(outDir, { recursive: true });
const manifest: ImageManifest = existsSync(manifestFile)
  ? ImageManifest.parse(JSON.parse(readFileSync(manifestFile, "utf8")))
  : {};

for (const [key, query] of Object.entries(WANTED)) {
  if (manifest[key] && existsSync(join(outDir, manifest[key].file))) {
    console.log(`= ${key} (cached)`);
    continue;
  }
  try {
    const pages = await search(query);
    const pick = pages.find((p) => {
      const ii = p.imageinfo?.[0];
      const lic = ii?.extmetadata?.LicenseShortName?.value ?? "";
      return ii && /^image\/(jpeg|png)$/.test(ii.mime) && OK_LICENSE.test(lic) && ii.thumburl;
    });
    if (!pick) {
      console.warn(`! ${key}: no licence-clean bitmap for "${query}"`);
      continue;
    }
    const ii = pick.imageinfo![0];
    const ext = ii.mime === "image/png" ? "png" : "jpg";
    const file = `${key}.${ext}`;
    const bin = await fetch(ii.thumburl!, { headers: { "User-Agent": UA } });
    if (!bin.ok) throw new Error(`download ${bin.status}`);
    writeFileSync(join(outDir, file), Buffer.from(await bin.arrayBuffer()));
    const md = ii.extmetadata ?? {};
    manifest[key] = {
      key,
      file,
      title: strip(md.ObjectName?.value) || pick.title.replace(/^File:/, ""),
      author: strip(md.Artist?.value) || strip(md.Credit?.value) || "Unknown",
      license: md.LicenseShortName?.value ?? "",
      licenseUrl: md.LicenseUrl?.value,
      source: `https://commons.wikimedia.org/wiki/${encodeURIComponent(pick.title.replace(/ /g, "_"))}`,
      width: ii.thumbwidth,
      height: ii.thumbheight,
    };
    console.log(`✓ ${key} ← ${pick.title} [${manifest[key].license}]`);
    await new Promise((r) => setTimeout(r, 400));
  } catch (e) {
    console.warn(`! ${key}: ${(e as Error).message}`);
  }
}

writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
console.log(`\n${Object.keys(manifest).length} images in manifest → ${manifestFile}`);
