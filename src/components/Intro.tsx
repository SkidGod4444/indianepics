"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { Play, ArrowDown } from "lucide-react";
import type { Chapter } from "@/content/schema";
import { useLang } from "@/lib/i18n";
import { pick } from "@/lib/text";
import { glyphForChapter } from "@/lib/timeline";
import { Button } from "@/components/ui/button";
import { DotGlyph } from "./DotGlyph";
import { DotIndia } from "./DotIndia";

type Props = {
  chapters: Chapter[];
  eventCount: number;
  onPlay: () => void;
  onSeek: (chapter: number) => void;
};

/** The hero: the subcontinent in breathing dots, the promise in one line, and two ways in. */
export function Intro({ chapters, eventCount, onPlay, onSeek }: Props) {
  const { lang } = useLang();
  const hi = lang === "hi";
  const { scrollY } = useScroll();
  const fade = useTransform(scrollY, [0, 420], [1, 0]);
  const lift = useTransform(scrollY, [0, 420], [0, -40]);
  const rise = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

  return (
    <section className="relative z-[2] overflow-hidden px-5 pb-10 pt-20 lg:px-10 lg:pt-24">
      <motion.div style={{ opacity: fade, y: lift }} className="mx-auto flex min-h-[calc(100svh-7.5rem)] max-w-[1280px] flex-col">
        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4">
          <div className="relative z-10">
            <motion.p {...rise} transition={{ duration: 0.5 }} className="mb-5 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-3">
              {hi ? "एक स्क्रॉल-चालित एटलस" : "A scroll-driven atlas"} · {chapters.length} {hi ? "अध्याय" : "chapters"} · {eventCount} {hi ? "पिन" : "pins"} ·{" "}
              {hi ? "खुला डेटा" : "open data"}
            </motion.p>
            <motion.h1
              {...rise}
              transition={{ duration: 0.6, delay: 0.08 }}
              className={`${hi ? "font-hi" : "font-display"} text-[clamp(2.8rem,6.4vw,6rem)] leading-[0.95] tracking-[-0.02em] text-ink [text-wrap:balance]`}
            >
              {hi ? (
                <>सतयुग से आज की सुबह तक।</>
              ) : (
                <>
                  From the <span className="whitespace-nowrap">Satya Yuga</span> to this morning.
                </>
              )}
            </motion.h1>
            <motion.p
              {...rise}
              transition={{ duration: 0.6, delay: 0.18 }}
              className={`mt-6 max-w-[52ch] text-[16px] leading-relaxed text-ink-2 lg:text-[17px] ${hi ? "font-hi" : ""}`}
            >
              {hi
                ? "एक नक़्शा, दो धाराएँ। इतिहास-पुराण की परंपरा और पुरातत्व के प्रमाण एक ही स्क्रॉल पर चलते हैं, पर एक ही पैमाने पर नहीं। हर अध्याय अपना रंग, अपनी बनावट और अपने चित्र लाता है।"
                : "One map, two tracks. The Itihasa-Purana tradition and the archaeological record share a scroll, never a scale. Every chapter brings its own paper, its own light and its own drawings; the pins, the empires and the year follow as you go."}
            </motion.p>
            <motion.div {...rise} transition={{ duration: 0.5, delay: 0.3 }} className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={onPlay} className="rounded-full px-6">
                <Play data-icon="inline-start" />
                {hi ? "कहानी चलाएँ" : "Play the story"}
              </Button>
              <Button size="lg" variant="outline" onClick={() => onSeek(0)} className="rounded-full bg-paper/70 px-6 backdrop-blur-sm">
                <ArrowDown data-icon="inline-start" />
                {hi ? "शुरू से पढ़ें" : "Start at the beginning"}
              </Button>
            </motion.div>
            <motion.div {...rise} transition={{ duration: 0.5, delay: 0.42 }} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[12.5px] text-ink-2">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-evidence ring-2 ring-paper" />
                {hi ? "प्रमाण: पुरातत्व और दस्तावेज़ों से दिनांकित" : "Evidence: dated by archaeology and documents"}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rotate-45 bg-tradition ring-2 ring-paper" />
                {hi ? "परंपरा: इतिहास-पुराण का कहा हुआ समय" : "Tradition: the told time of the Itihasa and Puranas"}
              </span>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="relative mx-auto w-full max-w-[520px] text-evidence"
          >
            <div className="pointer-events-none absolute inset-[-12%] -z-10 rounded-full bg-[radial-gradient(closest-side,var(--evidence-soft),transparent_72%)] opacity-60" />
            <DotIndia className="mx-auto block h-[min(560px,56vh)] w-auto max-w-full" />
            <p className="mt-2 text-center text-[10.5px] uppercase tracking-[0.18em] text-ink-3">
              {hi ? "नैचुरल अर्थ, भारतीय दृष्टिकोण संस्करण" : "Natural Earth, India point-of-view edition"}
            </p>
          </motion.div>
        </div>

        {/* Table of contents: one chip per chapter, each a seek. */}
        <motion.nav
          {...rise}
          transition={{ duration: 0.5, delay: 0.55 }}
          aria-label="Chapters"
          className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-2 lg:mx-0 lg:flex-wrap lg:px-0 [scrollbar-width:none]"
        >
          {chapters.map((c, i) => (
            <button
              key={c.id}
              onClick={() => onSeek(i)}
              className={`group flex shrink-0 items-center gap-2 rounded-full border border-hair bg-paper/80 py-1.5 pl-1.5 pr-3 text-left text-[12px] text-ink-2 backdrop-blur-sm transition-colors hover:border-ink hover:text-ink ${
                hi ? "font-hi" : ""
              }`}
            >
              <span className={`rounded-full p-1 ${c.track === "tradition" ? "text-tradition" : "text-evidence"}`}>
                <DotGlyph name={glyphForChapter(c)} size={18} />
              </span>
              <span className="text-[10px] tabular-nums text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              <span className="truncate">{pick(c, "title", lang)}</span>
            </button>
          ))}
        </motion.nav>
      </motion.div>
    </section>
  );
}
