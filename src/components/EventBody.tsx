"use client";

import type { Basis, EpicEvent, FullEvent } from "@/content/schema";
import { formatRange, paragraphs } from "@/lib/format";
import { pick, langClass, type Lang } from "@/lib/text";
import { useLang } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageStage } from "./ImageStage";

const BASIS: Record<Basis, { en: string; hi: string }> = {
  archaeological: { en: "Rests on excavation", hi: "आधार: उत्खनन" },
  epigraphic: { en: "Rests on inscriptions", hi: "आधार: अभिलेख" },
  textual: { en: "Rests on texts", hi: "आधार: ग्रंथ" },
  documentary: { en: "Rests on documents", hi: "आधार: दस्तावेज़" },
  traditional: { en: "Rests on tradition", hi: "आधार: परंपरा" },
};

type Props = {
  ev: FullEvent;
  /** Defaults to the header's language toggle, so the static /event/<id>/ page follows it too. */
  lang?: Lang;
  heading?: "h1" | "h2";
  showTitle?: boolean;
  showImage?: boolean;
};

/** Shared by the in-page detail overlay and the static /event/[slug] page (prerendered in English, then follows the toggle). */
export function EventBody({ ev, lang: langProp, heading = "h2", showTitle = true, showImage = true }: Props) {
  const ctx = useLang();
  const lang = langProp ?? ctx.lang;
  const H = heading;
  const tradition = ev.track === "tradition";
  const hi = lang === "hi";
  const claims = ev.claims ?? [];
  const debated = claims.filter((c) => c.contested);
  const settled = claims.filter((c) => !c.contested);
  const citeLinks = (sources: EpicEvent["sources"]) =>
    sources.map((s, i) => (
      <span key={i}>
        {i ? "; " : ""}
        {s.url ? (
          <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-hair underline-offset-2 hover:text-ink">
            {s.title}
          </a>
        ) : (
          s.title
        )}
        {s.second_hand ? <span className="text-ink-2"> · {hi ? "परोक्ष स्रोत" : "second-hand"}</span> : null}
      </span>
    ));
  return (
    <article className="space-y-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={`${tradition ? "border-tradition/40 text-tradition" : "border-evidence/40 text-evidence"} ${hi ? "font-hi" : ""}`}>
            {hi ? (tradition ? "परंपरा" : "साक्ष्य") : tradition ? "Tradition" : "Evidence"}
          </Badge>
          {ev.basis ? (
            <Badge variant="outline" className={`border-hair text-ink-2 ${hi ? "font-hi" : ""}`}>
              {BASIS[ev.basis][lang]}
            </Badge>
          ) : null}
          <span className="text-[12px] uppercase tracking-[0.14em] text-ink-3">{ev.date ? formatRange(ev.date) : ev.tradition_date}</span>
        </div>
        {showTitle ? <H className={`${langClass(lang)} text-[1.75rem] leading-[1.1] text-ink`}>{pick(ev, "title", lang)}</H> : null}
        <p className="text-sm text-ink-2">{ev.location.name}</p>
      </header>
      {showImage && ev.imageEntry ? <ImageStage entry={ev.imageEntry} ratio="wide" /> : null}
      <p className={`text-[15px] leading-relaxed text-ink ${lang === "hi" ? "font-hi" : ""}`}>{pick(ev, "summary", lang)}</p>
      <div className="space-y-3 text-[15px] leading-relaxed text-ink-2">
        {paragraphs(ev.body).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {tradition ? (
        <p className={`border-l-2 border-tradition/50 pl-3 text-[13px] leading-snug text-ink-2 ${hi ? "font-hi" : ""}`}>
          {hi ? "पुराणों में वर्णित पारंपरिक कालक्रम। पुरातात्विक या ऐतिहासिक साक्ष्य से इसकी तिथि तय नहीं है।" : "Traditional chronology as described in Puranic texts. Not dated by archaeological or historical evidence."}
        </p>
      ) : null}
      {settled.length ? (
        <ul className="space-y-2 text-[14px] leading-relaxed text-ink-2">
          {settled.map((c, i) => (
            <li key={i}>
              <span className={hi ? "font-hi" : ""}>{pick(c, "text", lang)}</span> <span className="text-[12px] text-ink-3">{citeLinks(c.sources)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {debated.length ? (
        <aside className="rounded-[3px] border border-hair bg-paper-2/60 p-4">
          <p className={`mb-2 text-ink-3 ${hi ? "font-hi text-[13px]" : "text-[11px] uppercase tracking-[0.18em]"}`}>{hi ? "इस पर बहस है" : "Debated"}</p>
          <ul className="space-y-3 text-[14px] leading-relaxed text-ink-2">
            {debated.map((c, i) => (
              <li key={i}>
                <span className={hi ? "font-hi" : ""}>{pick(c, "text", lang)}</span>
                <span className="mt-0.5 block text-[12px] text-ink-3">{citeLinks(c.sources)}</span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
      <ul className="flex flex-wrap gap-1.5">
        {ev.tags.map((t) => (
          <li key={t}>
            <Badge variant="secondary" className="text-ink-2">
              {t}
            </Badge>
          </li>
        ))}
      </ul>
      <Separator />
      <footer>
        <p className={`mb-1 text-ink-3 ${hi ? "font-hi text-[13px]" : "text-[11px] uppercase tracking-[0.18em]"}`}>{hi ? "स्रोत" : "Sources"}</p>
        <ol className="space-y-1 text-[13px] text-ink-2">
          {ev.sources.map((s, i) => (
            <li key={i}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-hair underline-offset-2 hover:text-ink">
                  {s.title}
                </a>
              ) : (
                s.title
              )}
              {s.second_hand ? <span className="text-ink-2"> · {hi ? "परोक्ष स्रोत" : "second-hand"}</span> : null}
              {s.note ? <span className="text-ink-3"> · {s.note}</span> : null}
            </li>
          ))}
        </ol>
      </footer>
    </article>
  );
}
