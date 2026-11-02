import { Fragment, type ReactNode } from "react";
import type { Ledger as LedgerRecord } from "@/content/schema";
import { pick, langClass, type Lang } from "@/lib/text";

type Cited = { sources: { title: string; url?: string; note?: string; second_hand?: boolean }[] };

const t = (lang: Lang, en: string, hi: string) => (lang === "hi" ? hi : en);
const yearsOf = (f: { years: string }, lang: Lang) => (lang === "hi" ? f.years.replace(" to ", " से ") : f.years);

function Cites({ sources, lang }: Cited & { lang: Lang }) {
  return (
    <p className="mt-2 text-[12px] leading-snug text-ink-3">
      <span className={lang === "hi" ? "font-hi" : ""}>{t(lang, "Sources: ", "स्रोत: ")}</span>
      {sources.map((s, i) => (
        <Fragment key={i}>
          {i ? "; " : ""}
          {s.url ? (
            <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-hair underline-offset-2 hover:text-ink">
              {s.title}
            </a>
          ) : (
            s.title
          )}
          {s.second_hand ? (
            <span className="text-ink-2">
              {" "}
              · <span className={lang === "hi" ? "font-hi" : ""}>{t(lang, "second-hand", "परोक्ष स्रोत")}</span>
              {s.note ? ` (${s.note})` : ""}
            </span>
          ) : null}
        </Fragment>
      ))}
    </p>
  );
}

function Part({ id, title, intro, lang, children }: { id: string; title: string; intro?: string; lang: Lang; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-ink/70 pt-5">
      <h3 id={lang === "hi" ? `${id}-hi` : id} className={`${langClass(lang)} text-[1.7rem] leading-tight text-ink`}>
        {title}
      </h3>
      {intro ? <p className={`mt-2 max-w-[68ch] text-[15px] leading-relaxed text-ink-2 ${lang === "hi" ? "font-hi" : ""}`}>{intro}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** A share as a bar in a ledger row. Every figure is printed beside it, so nothing depends on reading the bar. */
function Bar({ value, max, mark, faint = false }: { value: number; max: number; mark?: number; faint?: boolean }) {
  return (
    <div aria-hidden className="relative h-[10px] w-full bg-paper-2">
      <div className={`absolute inset-y-0 left-0 bg-evidence ${faint ? "opacity-55" : ""}`} style={{ width: `${(value / max) * 100}%` }} />
      {mark !== undefined ? <div className="absolute -inset-y-[3px] w-[2px] bg-ink" style={{ left: `${(mark / max) * 100}%` }} /> : null}
    </div>
  );
}

const headCell = "pb-2 text-left text-[11px] font-medium text-ink-3";
const yearCell = "w-[3.4rem] py-[7px] pr-3 text-left font-normal text-ink";
const numCell = "w-[3.6rem] whitespace-nowrap py-[7px] pl-3 text-right text-ink";

/**
 * The reckoning at the end of the book, set out as a ledger. Disputed figures stay ranges, with their authors named.
 * Plain markup with no state, so the server renders it for /reckoning/ and the browser renders it on the home page.
 */
export function Reckoning({ record, lang, heading: Heading = "h2" }: { record: LedgerRecord; lang: Lang; heading?: "h1" | "h2" }) {
  const { economy, drain, famines, artefacts, repatriation, languages, states, ledger: account } = record;
  const hi = lang === "hi";
  const body = hi ? "font-hi" : "";

  const shareMax = Math.max(...economy.share.flatMap((s) => [s.gdp, s.population ?? 0]));
  const headMax = Math.max(100, ...economy.per_capita.map((p) => p.percent_of_britain));
  const deathMax = Math.max(...famines.map((f) => f.high));
  const sides = [
    { side: "lost" as const, title: t(lang, "Lost", "जो गया") },
    { side: "introduced" as const, title: t(lang, "Introduced", "जो आया") },
  ];

  return (
    <div className="relative mx-auto max-w-[1100px] space-y-14">
        <header>
          <p className={`text-ink-3 ${hi ? "font-hi text-[13px]" : "text-[11px] font-medium uppercase tracking-[0.2em]"}`}>{t(lang, "The last pages", "आख़िरी पन्ने")}</p>
          <Heading className={`${langClass(lang)} mt-2 text-[clamp(2.4rem,5vw,4rem)] leading-none text-ink`}>
            {t(lang, "The reckoning", "हिसाब")}
          </Heading>
          <p className={`mt-4 max-w-[62ch] text-[15px] leading-relaxed text-ink-2 ${body}`}>
            {t(
              lang,
              `What the subcontinent held, what it lost and what arrived, in the historians' own figures. Where they disagree, both sides stay on the page. Figures checked ${record.updated}.`,
              `उपमहाद्वीप के पास क्या था, क्या गया और क्या आया, इतिहासकारों के अपने आँकड़ों में। जहाँ वे असहमत हैं, दोनों पक्ष यहाँ हैं। आँकड़े ${record.updated} को जाँचे गए।`,
            )}
          </p>
          <p className={`mt-3 max-w-[62ch] text-[13px] leading-relaxed text-ink-3 ${body}`}>
            {t(
              lang,
              "A source tagged second-hand was read through another work, an abstract, a summary or a press report, not in the original. Treat its figure as reported, not confirmed.",
              "जिस स्रोत पर परोक्ष स्रोत लिखा है, वह मूल रूप में नहीं पढ़ा गया, बल्कि किसी दूसरी कृति, सार, संक्षेप या समाचार रिपोर्ट के ज़रिए पढ़ा गया। उसके आँकड़े को पुष्ट नहीं, केवल बताया गया मानें।",
            )}
          </p>
        </header>

        <Part id="ledger-wealth" title={t(lang, "Wealth", "धन")} intro={pick(economy, "intro", lang)} lang={lang}>
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <table className="w-full border-collapse text-[13px] tabular-nums">
                <caption className={`mb-3 text-left text-[13px] leading-snug text-ink-2 ${body}`}>
                  {t(lang, "India's share of the world's output, with its share of the world's people marked by the upright line.", "दुनिया के उत्पादन में भारत का हिस्सा। खड़ी रेखा दुनिया की आबादी में उसका हिस्सा है।")}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className={headCell}>
                      {t(lang, "Year", "वर्ष")}
                    </th>
                    <th scope="col" className={headCell}>
                      <span className="sr-only">{t(lang, "Bar", "पट्टी")}</span>
                    </th>
                    <th scope="col" className={`${headCell} !text-right`}>
                      {t(lang, "Output", "उत्पादन")}
                    </th>
                    <th scope="col" className={`${headCell} !text-right`}>
                      {t(lang, "People", "आबादी")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {economy.share.map((s) => (
                    <tr key={s.year} className="border-t border-hair">
                      <th scope="row" className={yearCell}>
                        {s.year}
                      </th>
                      <td className="py-[7px]">
                        <Bar value={s.gdp} max={shareMax} mark={s.population} />
                      </td>
                      <td className={numCell}>{s.gdp}%</td>
                      <td className={`${numCell} text-ink-2`}>{s.population === undefined ? "" : `${s.population}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full border-collapse text-[13px] tabular-nums">
                <caption className={`mb-3 text-left text-[13px] leading-snug text-ink-2 ${body}`}>
                  {t(lang, "India's output per person, as a percentage of Britain's.", "भारत का प्रति व्यक्ति उत्पादन, ब्रिटेन के प्रतिशत के रूप में।")}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className={headCell}>
                      {t(lang, "Year", "वर्ष")}
                    </th>
                    <th scope="col" className={headCell}>
                      <span className="sr-only">{t(lang, "Bar", "पट्टी")}</span>
                    </th>
                    <th scope="col" className={`${headCell} !text-right`}>
                      {t(lang, "Of Britain", "ब्रिटेन का")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {economy.per_capita.map((p) => (
                    <tr key={p.year} className="border-t border-hair">
                      <th scope="row" className={yearCell}>
                        {p.year}
                      </th>
                      <td className="py-[7px]">
                        <Bar value={p.percent_of_britain} max={headMax} faint={p.approximate} />
                      </td>
                      <td className={numCell}>
                        {p.approximate ? "c. " : ""}
                        {p.percent_of_britain}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Cites sources={economy.sources} lang={lang} />
        </Part>

        <Part id="ledger-drain" title={t(lang, "The drain debate", "धन की निकासी पर बहस")} intro={pick(drain, "intro", lang)} lang={lang}>
          <div className="grid gap-x-8 gap-y-7 md:grid-cols-2 lg:grid-cols-3">
            {drain.positions.map((p) => (
              <article key={p.who} className="border-l-2 border-hair pl-4">
                <h4 className="font-display text-[1.15rem] leading-tight text-ink">{p.who}</h4>
                <p className="mt-0.5 text-[12.5px] italic leading-snug text-ink-3">{p.work}</p>
                <p className={`mt-2 text-[14px] leading-relaxed text-ink-2 ${body}`}>{pick(p, "stance", lang)}</p>
                {p.opinion ? <p className="mt-1 text-[12px] text-ink-3">{t(lang, "An opinion piece, not peer-reviewed research.", "यह एक मत-लेख है, समकक्ष-समीक्षित शोध नहीं।")}</p> : null}
                <Cites sources={p.sources} lang={lang} />
              </article>
            ))}
          </div>
        </Part>

        <Part
          id="ledger-famines"
          title={t(lang, "Famines", "अकाल")}
          intro={t(lang, "Excess deaths, in millions. No register counted them, so each famine is a range between the lowest and highest serious estimates.", "अतिरिक्त मौतें, मिलियन में। इन्हें किसी रजिस्टर ने नहीं गिना, इसलिए हर अकाल का आँकड़ा सबसे कम और सबसे अधिक गंभीर अनुमानों के बीच की सीमा है।")}
          lang={lang}
        >
          <ol className="space-y-5">
            {famines.map((f) => (
              <li key={f.name} className="grid gap-x-8 gap-y-2 border-t border-hair pt-3 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
                <div>
                  <h4 className={`${langClass(lang)} text-[1.1rem] leading-tight text-ink`}>
                    {pick(f, "name", lang)} {pick(f, "name", lang).includes(yearsOf(f, lang)) ? null : <span className="text-[13px] text-ink-3 tabular-nums">{yearsOf(f, lang)}</span>}
                  </h4>
                  <p className={`mt-0.5 text-[13px] text-ink-3 ${body}`}>{pick(f, "region", lang)}</p>
                </div>
                <div>
                  <div aria-hidden className="relative mt-1 h-[10px] w-full bg-paper-2">
                    <div className="absolute inset-y-0 bg-evidence/55" style={{ left: `${(f.low / deathMax) * 100}%`, width: `${Math.max(0.6, ((f.high - f.low) / deathMax) * 100)}%` }} />
                    {f.central !== undefined ? <div className="absolute -inset-y-[3px] w-[2px] bg-ink" style={{ left: `${(f.central / deathMax) * 100}%` }} /> : null}
                  </div>
                  <p className="mt-1.5 text-[13px] tabular-nums text-ink">
                    {f.low === f.high ? f.low : `${f.low} ${t(lang, "to", "से")} ${f.high}`} {t(lang, "million", "मिलियन")}
                    {f.central !== undefined ? (
                      <span className="text-ink-2">
                        {" "}
                        · {f.central} {f.central_by ? `(${f.central_by})` : ""}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className={`text-[14px] leading-relaxed text-ink-2 ${body}`}>{pick(f, "note", lang)}</p>
                  <Cites sources={f.sources} lang={lang} />
                </div>
              </li>
            ))}
          </ol>
        </Part>

        <Part id="ledger-artefacts" title={t(lang, "What was taken", "जो ले जाया गया")} lang={lang}>
          <ol className="grid gap-x-8 gap-y-6 md:grid-cols-2">
            {artefacts.map((a) => (
              <li key={a.name} className="border-t border-hair pt-3">
                <h4 className={`${langClass(lang)} text-[1.1rem] leading-tight text-ink`}>{pick(a, "name", lang)}</h4>
                <p className="mt-1 text-[13px] leading-snug text-ink-3">
                  {t(lang, "Taken", "ले जाया गया")}: {pick(a, "taken", lang)} · {t(lang, "Now", "अब")}: {pick(a, "held", lang)}
                </p>
                <p className={`mt-2 text-[14px] leading-relaxed text-ink-2 ${body}`}>{pick(a, "note", lang)}</p>
                <Cites sources={a.sources} lang={lang} />
              </li>
            ))}
          </ol>
          <div className="mt-8 space-y-4 border-l-2 border-evidence pl-4">
            {repatriation.map((r) => (
              <div key={r.as_of + r.text}>
                <p className="text-[12px] text-ink-3">
                  {t(lang, "As of", "स्थिति")} {r.as_of}
                </p>
                <p className={`mt-1 text-[14px] leading-relaxed text-ink-2 ${body}`}>{pick(r, "text", lang)}</p>
                <Cites sources={r.sources} lang={lang} />
              </div>
            ))}
          </div>
        </Part>

        <Part id="ledger-account" title={t(lang, "Lost and introduced", "जो गया, जो आया")} lang={lang}>
          <div className="grid gap-x-10 gap-y-10 lg:grid-cols-2 lg:divide-x lg:divide-hair">
            {sides.map(({ side, title }, i) => (
              <div key={side} className={i ? "lg:pl-10" : ""}>
                <h4 className={`mb-4 text-ink ${hi ? "font-hi text-[15px]" : "text-[11px] font-medium uppercase tracking-[0.2em]"}`}>{title}</h4>
                <ul className="space-y-5">
                  {account
                    .filter((e) => e.side === side)
                    .map((e) => (
                      <li key={e.title}>
                        <h5 className={`${langClass(lang)} text-[1.05rem] leading-tight text-ink`}>{pick(e, "title", lang)}</h5>
                        <p className={`mt-1 text-[14px] leading-relaxed text-ink-2 ${body}`}>{pick(e, "body", lang)}</p>
                        <Cites sources={e.sources} lang={lang} />
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </Part>

        <Part id="ledger-languages" title={t(lang, "Languages", "भाषाएँ")} intro={pick(languages, "intro", lang)} lang={lang}>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
            {languages.facts.map((f) => (
              <div key={f.label} className="border-t border-hair pt-2">
                <dd className="font-display text-[1.6rem] leading-tight text-ink tabular-nums">{pick(f, "value", lang)}</dd>
                <dt className={`mt-1 text-[13px] leading-snug text-ink-2 ${body}`}>{pick(f, "label", lang)}</dt>
                <Cites sources={f.sources} lang={lang} />
              </div>
            ))}
          </dl>
        </Part>

        <Part id="ledger-states" title={t(lang, "How today's states were drawn", "आज के राज्य कैसे बने")} lang={lang}>
          <ol className="grid gap-x-8 md:grid-cols-2">
            {states.map((s) => (
              <li key={s.year + s.change} className="grid grid-cols-[3.4rem_minmax(0,1fr)] gap-x-3 border-t border-hair py-2.5">
                <span className="text-[14px] tabular-nums text-ink">{s.year}</span>
                <div>
                  <p className={`text-[14px] leading-snug text-ink-2 ${body}`}>{pick(s, "change", lang)}</p>
                  <Cites sources={s.sources} lang={lang} />
                </div>
              </li>
            ))}
          </ol>
        </Part>
    </div>
  );
}
