import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EventBody } from "@/components/EventBody";
import { Header } from "@/components/Header";
import { chapters, events, eventsForChapter, getEvent, getImage } from "@/lib/content";
import { JsonLd, abs, absImage, chapterPath, eventJsonLd, eventMarkdown, eventPath } from "@/lib/seo";

export function generateStaticParams() {
  return events.map((e) => ({ slug: e.id }));
}

export async function generateMetadata({ params }: PageProps<"/event/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const ev = getEvent(slug);
  if (!ev) return {};
  const ch = chapters.find((c) => c.id === ev.chapter);
  const img = getImage(ev.image);
  const title = ev.title_hi ? `${ev.title} · ${ev.title_hi}` : ev.title;
  return {
    title,
    description: ev.summary,
    keywords: [...ev.tags, ev.location.name, ch?.title ?? "", "Indian history", "atlas"].filter(Boolean),
    alternates: { canonical: abs(eventPath(ev.id)), types: { "text/markdown": abs(eventMarkdown(ev.id)) } },
    openGraph: {
      type: "article",
      title: ev.title,
      description: ev.summary,
      url: abs(eventPath(ev.id)),
      section: ch?.title,
      tags: ev.tags,
      images: img ? [{ url: absImage(img), alt: img.title }] : undefined,
    },
    twitter: { card: "summary_large_image", title: ev.title, description: ev.summary },
  };
}

export default async function EventPage({ params }: PageProps<"/event/[slug]">) {
  const { slug } = await params;
  const ev = getEvent(slug);
  if (!ev) notFound();
  const ch = chapters.find((c) => c.id === ev.chapter);
  const siblings = eventsForChapter(ev.chapter);
  const i = siblings.findIndex((e) => e.id === ev.id);
  const prev = siblings[i - 1];
  const next = siblings[i + 1];
  return (
    <main className="min-h-screen">
      <Header />
      <JsonLd data={eventJsonLd(ev, ch)} />
      <div className="mx-auto max-w-[680px] px-5 pb-24 pt-24 lg:px-0">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-x-2 text-[12px] text-ink-3">
          <Link href={`/#${ev.chapter}`} className="underline decoration-hair underline-offset-2 hover:text-ink">
            Map
          </Link>
          <span aria-hidden>/</span>
          {ch ? (
            <Link href={chapterPath(ch.id)} className="underline decoration-hair underline-offset-2 hover:text-ink">
              {ch.title}
            </Link>
          ) : null}
          <span aria-hidden>/</span>
          <span className="text-ink-2">{ev.title}</span>
          <span className="ml-auto">
            <a href={eventMarkdown(ev.id)} className="underline decoration-hair underline-offset-2 hover:text-ink">
              Markdown
            </a>
          </span>
        </nav>
        <EventBody ev={ev} heading="h1" />
        <nav className="mt-12 flex justify-between gap-4 border-t border-hair pt-6 text-[13px]">
          {prev ? (
            <Link href={eventPath(prev.id)} className="text-ink-2 hover:text-ink">
              ← {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={eventPath(next.id)} className="text-right text-ink-2 hover:text-ink">
              {next.title} →
            </Link>
          ) : null}
        </nav>
      </div>
    </main>
  );
}
