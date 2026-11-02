import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/badge";
import { chapters, eventsForChapter, getImage, imageSrc } from "@/lib/content";
import { formatYear, paragraphs } from "@/lib/format";
import { JsonLd, abs, absImage, chapterJsonLd, chapterMarkdown, chapterPath, eventDateLabel, eventPath } from "@/lib/seo";

export function generateStaticParams() {
  return chapters.map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ch = chapters.find((c) => c.id === slug);
  if (!ch) return {};
  const evs = eventsForChapter(ch.id);
  const description = `${ch.kicker ?? ""}${ch.kicker ? ". " : ""}${evs.length} dated and sourced events: ${evs
    .slice(0, 4)
    .map((e) => e.title)
    .join(", ")}${evs.length > 4 ? " and more" : ""}.`;
  const img = getImage(ch.image);
  return {
    title: ch.title,
    description,
    alternates: { canonical: abs(chapterPath(ch.id)), types: { "text/markdown": abs(chapterMarkdown(ch.id)) } },
    openGraph: { type: "website", title: ch.title, description, url: abs(chapterPath(ch.id)), images: img ? [absImage(img)] : undefined },
  };
}

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ch = chapters.find((c) => c.id === slug);
  if (!ch) notFound();
  const evs = eventsForChapter(ch.id);
  const idx = chapters.findIndex((c) => c.id === ch.id);
  const prev = chapters[idx - 1];
  const next = chapters[idx + 1];
  const img = getImage(ch.image);
  return (
    <main className="min-h-screen">
      <Header backed />
      <JsonLd data={chapterJsonLd(ch, evs)} />
      <article className="mx-auto max-w-[760px] px-5 pb-24 pt-24 lg:px-0">
        <Link href={`/#${ch.id}`} className="mb-8 inline-block text-[12px] text-ink-3 underline decoration-hair underline-offset-2 hover:text-ink">
          ← Open this chapter on the map
        </Link>
        <p className={`text-[11px] font-medium uppercase tracking-[0.2em] ${ch.track === "tradition" ? "text-tradition" : "text-evidence"}`}>
          Chapter {String(idx + 1).padStart(2, "0")} · {ch.kicker ?? (ch.years ? `${formatYear(ch.years.start)} – ${formatYear(ch.years.end)}` : ch.stops?.join(" · "))}
        </p>
        <h1 className="font-display mt-2 text-[clamp(2.2rem,5vw,3.6rem)] leading-[1.02] text-ink">{ch.title}</h1>
        {ch.title_hi ? <p className="font-hi mt-2 text-[1.4rem] text-ink-2">{ch.title_hi}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="outline">{ch.track}</Badge>
          <Badge variant="outline">{evs.length} events</Badge>
          <a href={chapterMarkdown(ch.id)} className="text-[12px] text-ink-3 underline decoration-hair underline-offset-2 hover:text-ink">
            Markdown version
          </a>
        </div>
        {img ? (
          <figure className="mt-8">
            <img src={imageSrc(img.key)} alt={img.title} className="aspect-[16/9] w-full rounded-md border border-hair object-cover" />
            <figcaption className="mt-2 text-[11px] leading-tight text-ink-3">
              {img.title}. {img.author},{" "}
              {img.licenseUrl ? (
                <a href={img.licenseUrl} className="underline decoration-hair underline-offset-2" target="_blank" rel="noreferrer">
                  {img.license}
                </a>
              ) : (
                img.license
              )}
              , via{" "}
              <a href={img.source} className="underline decoration-hair underline-offset-2" target="_blank" rel="noreferrer">
                Wikimedia Commons
              </a>
              .
            </figcaption>
          </figure>
        ) : null}
        <div className="mt-8 space-y-4 text-[16px] leading-relaxed text-ink-2">
          {paragraphs(ch.body).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <h2 className="font-display mt-12 text-[1.5rem] text-ink">Events in this chapter</h2>
        <ol className="mt-4 divide-y divide-hair">
          {evs.map((e) => (
            <li key={e.id} className="py-4">
              <p className={`text-[11px] font-medium uppercase tracking-[0.16em] ${e.track === "tradition" ? "text-tradition" : "text-evidence"}`}>
                {eventDateLabel(e)} · {e.location.name}
              </p>
              <h3 className="font-display mt-1 text-[1.25rem] leading-tight text-ink">
                <Link href={eventPath(e.id)} className="hover:underline">
                  {e.title}
                </Link>
              </h3>
              <p className="mt-1 text-[14px] leading-snug text-ink-2">{e.summary}</p>
            </li>
          ))}
        </ol>
        <nav className="mt-12 flex justify-between text-[13px]">
          {prev ? (
            <Link href={chapterPath(prev.id)} className="text-ink-2 hover:text-ink">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={chapterPath(next.id)} className="text-ink-2 hover:text-ink">
              {next.title} →
            </Link>
          ) : null}
        </nav>
      </article>
    </main>
  );
}
