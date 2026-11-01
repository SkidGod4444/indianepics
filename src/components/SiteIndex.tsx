import Link from "next/link";
import { chapters, eventsForChapter, formatYear } from "@/lib/content";
import { chapterMarkdown, chapterPath, eventDateLabel, eventMarkdown, eventPath } from "@/lib/seo";

/** The whole book as plain links: for readers who want a table of contents, and for crawlers. Server-rendered. */
export function SiteIndex() {
  return (
    <section id="index" aria-labelledby="index-title" className="relative z-[2] border-t border-hair bg-paper px-5 pb-20 pt-16 lg:px-10">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ink-3">Index</p>
            <h2 id="index-title" className="font-display mt-2 text-[2rem] leading-none text-ink">
              Every chapter and every pin
            </h2>
          </div>
          <p className="max-w-[46ch] text-[12.5px] leading-snug text-ink-3">
            Each page is also available as Markdown for agents and offline readers:{" "}
            <a href="/llms.txt" className="underline decoration-hair underline-offset-2 hover:text-ink">
              llms.txt
            </a>
            ,{" "}
            <a href="/llms-full.txt" className="underline decoration-hair underline-offset-2 hover:text-ink">
              llms-full.txt
            </a>
            ,{" "}
            <a href="/sitemap.xml" className="underline decoration-hair underline-offset-2 hover:text-ink">
              sitemap
            </a>
            .
          </p>
        </div>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {chapters.map((c, i) => {
            const evs = eventsForChapter(c.id);
            return (
              <div key={c.id}>
                <h3 className="font-display text-[1.15rem] leading-tight text-ink">
                  <span className="mr-2 text-[11px] tabular-nums text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                  <Link href={chapterPath(c.id)} className="hover:underline">
                    {c.title}
                  </Link>
                </h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-ink-3">
                  {c.kicker ?? (c.years ? `${formatYear(c.years.start)} – ${formatYear(c.years.end)}` : c.stops?.join(" · "))} ·{" "}
                  <a href={chapterMarkdown(c.id)} className="normal-case tracking-normal underline decoration-hair underline-offset-2 hover:text-ink">
                    .md
                  </a>
                </p>
                <ul className="mt-3 space-y-1.5">
                  {evs.map((e) => (
                    <li key={e.id} className="flex items-baseline gap-2 text-[13px] leading-snug">
                      <span className={`w-[5.5rem] shrink-0 text-[11px] tabular-nums ${e.track === "tradition" ? "text-tradition" : "text-evidence"}`}>
                        {eventDateLabel(e).replace(/\s*±.*$/, "")}
                      </span>
                      <Link href={eventPath(e.id)} className="text-ink-2 hover:text-ink hover:underline">
                        {e.title}
                      </Link>
                      <a href={eventMarkdown(e.id)} className="text-[10px] text-ink-3 hover:text-ink" aria-label={`${e.title} as Markdown`}>
                        .md
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-14 text-[11.5px] text-ink-3">
          Code MIT · content CC BY-SA 4.0 · photographs carry their own licences, credited where shown · boundaries approximate unless marked traced ·{" "}
          <a href="https://github.com/SkidGod4444/indianepics" className="underline decoration-hair underline-offset-2 hover:text-ink">
            source on GitHub
          </a>
        </p>
      </div>
    </section>
  );
}
