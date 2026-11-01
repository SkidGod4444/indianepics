import type { EpicEvent } from "@/content/schema";
import { formatRange, paragraphs } from "@/lib/content";
import { pick, langClass, type Lang } from "@/lib/text";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageStage } from "./ImageStage";

type Props = {
  ev: EpicEvent;
  lang: Lang;
  heading?: "h1" | "h2";
  showTitle?: boolean;
  showImage?: boolean;
};

/** Shared by the in-page detail overlay and the static /event/[slug] page. No hooks, renders on the server too. */
export function EventBody({ ev, lang, heading = "h2", showTitle = true, showImage = true }: Props) {
  const H = heading;
  const tradition = ev.track === "tradition";
  return (
    <article className="space-y-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={tradition ? "border-tradition/40 text-tradition" : "border-evidence/40 text-evidence"}>
            {tradition ? "Tradition" : "Evidence"}
          </Badge>
          <span className="text-[12px] uppercase tracking-[0.14em] text-ink-3">{ev.date ? formatRange(ev.date) : ev.tradition_date}</span>
        </div>
        {showTitle ? <H className={`${langClass(lang)} text-[1.75rem] leading-[1.1] text-ink`}>{pick(ev, "title", lang)}</H> : null}
        <p className="text-sm text-ink-2">{ev.location.name}</p>
      </header>
      {showImage && ev.image ? <ImageStage image={ev.image} ratio="wide" /> : null}
      <p className={`text-[15px] leading-relaxed text-ink ${lang === "hi" ? "font-hi" : ""}`}>{pick(ev, "summary", lang)}</p>
      <div className="space-y-3 text-[15px] leading-relaxed text-ink-2">
        {paragraphs(ev.body).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
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
        <p className="mb-1 text-[11px] uppercase tracking-[0.18em] text-ink-3">Sources</p>
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
              {s.note ? <span className="text-ink-3"> · {s.note}</span> : null}
            </li>
          ))}
        </ol>
      </footer>
    </article>
  );
}
