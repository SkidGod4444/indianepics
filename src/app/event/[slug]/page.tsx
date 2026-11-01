import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EventBody } from "@/components/EventBody";
import { Header } from "@/components/Header";
import { events, getEvent } from "@/lib/content";

export function generateStaticParams() {
  return events.map((e) => ({ slug: e.id }));
}

export async function generateMetadata({ params }: PageProps<"/event/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const ev = getEvent(slug);
  return ev ? { title: `${ev.title} · indianepics`, description: ev.summary } : {};
}

export default async function EventPage({ params }: PageProps<"/event/[slug]">) {
  const { slug } = await params;
  const ev = getEvent(slug);
  if (!ev) notFound();
  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-[680px] px-5 pb-24 pt-24 lg:px-0">
        <Link href={`/#${ev.chapter}`} className="mb-8 inline-block text-[12px] text-ink-3 underline decoration-hair underline-offset-2 hover:text-ink">
          ← Back to the map
        </Link>
        <EventBody ev={ev} lang="en" heading="h1" />
      </div>
    </main>
  );
}
