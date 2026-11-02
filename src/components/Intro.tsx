"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Play, ArrowDown, Pause } from "lucide-react";
import type { Chapter } from "@/content/schema";
import { useLang } from "@/lib/i18n";
import { pick } from "@/lib/text";
import { glyphForChapter } from "@/lib/timeline";
import { BASE_ERA } from "@/lib/eras";
import { Button } from "@/components/ui/button";
import { DotGlyph } from "./DotGlyph";
import { DotPlate, type Plate } from "./DotPlate";
import { Logo } from "./Logo";

type Props = {
  chapters: Chapter[];
  plates?: Plate[];
  onPlay: () => void;
  /** True while the story (or its prologue) is running, so the button reads Pause. */
  playing?: boolean;
  onSeek: (chapter: number) => void;
};

/** The hero: the subcontinent in breathing dots, the promise in one line, and two ways in. */
export function Intro({ chapters, plates = [], onPlay, onSeek, playing = false }: Props) {
  const reduce = useReducedMotion();
  // Which plate the hero shows: the chip under the pointer, else a slow walk through the chapters.
  const [hovered, setHovered] = useState<number | null>(null);
  const [auto, setAuto] = useState(() => Math.min(3, Math.max(0, plates.length - 1)));
  useEffect(() => {
    if (reduce || hovered !== null || plates.length < 2) return;
    const id = window.setInterval(() => setAuto((a) => (a + 1) % plates.length), 6500);
    return () => window.clearInterval(id);
  }, [reduce, hovered, plates.length]);
  const plateIdx = hovered ?? auto;
  const plate = plates[plateIdx];
  const plateChapter = plate ? chapters.find((c) => c.id === plate.id) : undefined;
  const { lang } = useLang();
  const hi = lang === "hi";
  // Fade with the hero's own bottom edge: fully read while it is on screen, gone exactly when the stage
  // fades in (first chapter at 55% of the viewport). A fixed pixel window left phones on a blank screen.
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["end end", "end 0.55"] });
  const fade = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const lift = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const rise = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

  return (
    <section ref={ref} className="relative z-[2] overflow-hidden px-5 pb-10 pt-20 lg:px-10 lg:pt-24">
      <motion.div style={{ opacity: fade, y: lift }} className="mx-auto flex min-h-[calc(100svh-7.5rem)] max-w-[1280px] flex-col">
        <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-4">
          <div className="relative z-10">
            <motion.div {...rise} transition={{ duration: 0.5 }} className="mb-7">
              <Logo href="" domain mark={false} size="lg" />
              <p className={`mt-2 text-ink-3 ${hi ? "font-hi text-[12.5px]" : "text-[11px] uppercase tracking-[0.18em]"}`}>
                {hi ? "भारत का इतिहास, एक नक़्शे पर" : "The history of India, on one map"}
              </p>
            </motion.div>
            <motion.h1
              {...rise}
              transition={{ duration: 0.6, delay: 0.08 }}
              // Pinned to the base type setting: when an era sets a heavier face the headline would rewrap,
              // the hero would grow, and every seek computed before that (chips, Start, Play) would land short.
              style={
                {
                  "--display-opsz": BASE_ERA.display.opsz,
                  "--display-soft": BASE_ERA.display.soft,
                  "--display-weight": BASE_ERA.display.weight,
                } as React.CSSProperties
              }
              className={`${hi ? "font-hi" : "font-display"} text-[clamp(2.8rem,6.4vw,6rem)] leading-[0.95] tracking-[-0.02em] text-ink [text-wrap:balance]`}
            >
              {hi ? (
                <>
                  महाकाव्य तो <span className="whitespace-nowrap">बस शुरुआत</span> थे।
                </>
              ) : (
                <>
                  The epics were <em className="font-light italic">only</em> the beginning.
                </>
              )}
            </motion.h1>
            <motion.p
              {...rise}
              transition={{ duration: 0.6, delay: 0.18 }}
              className={`mt-6 max-w-[52ch] text-[16px] leading-relaxed text-ink-2 lg:text-[17px] ${hi ? "font-hi" : ""}`}
            >
              {hi
                ? "सतयुग से आज की सुबह तक, एक ही नक़्शे पर। रामायण और महाभारत का कहा हुआ समय, और मुहरों, शिलालेखों, संधियों और चुनावों का दिनांकित इतिहास, साथ-साथ। हर अध्याय में काग़ज़ बदलता है, रोशनी बदलती है, और एक आवाज़ कहानी सुनाती है।"
                : "From the Satya Yuga to this morning, on a single map. The told time of the Ramayana and the Mahabharata runs beside the dated record of seals, edicts, treaties and elections. Each chapter changes the paper and the light, and a voice tells the story as the map moves."}
            </motion.p>
            <motion.div {...rise} transition={{ duration: 0.5, delay: 0.3 }} className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={onPlay} aria-pressed={playing} className="group h-12 rounded-full pl-5 pr-6 text-[15px]">
                <span className="relative mr-1 grid h-6 w-6 place-items-center rounded-full bg-paper/15">
                  {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 translate-x-px" />}
                </span>
                <span className="flex flex-col items-start leading-none">
                  <span>{playing ? (hi ? "रोकें" : "Pause") : hi ? "कहानी सुनें" : "Play the story"}</span>
                  <span className={`mt-1 text-[10.5px] font-normal text-paper/70 ${hi ? "font-hi" : "uppercase tracking-[0.14em]"}`}>
                    {hi ? "कथन के साथ" : "Narrated"}
                  </span>
                </span>
              </Button>
              <Button size="lg" variant="outline" onClick={() => onSeek(0)} className="h-12 rounded-full bg-paper/70 px-6 text-[15px] backdrop-blur-sm">
                <ArrowDown data-icon="inline-start" />
                {hi ? "अपनी गति से पढ़ें" : "Read at your own pace"}
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
            {plate ? (
              <figure className="mx-auto w-[min(440px,100%,calc(56vh*0.8))]">
                <div className="relative rounded-[4px] border border-hair/70 bg-paper-2/40 p-3 shadow-[0_1px_0_var(--hair),0_24px_60px_-30px_rgba(28,25,21,0.35)]">
                  <DotPlate plates={plates} active={plateIdx} className="block w-full" />
                </div>
                <figcaption className="mt-3 flex items-baseline justify-between gap-3 text-ink-3">
                  <span className={`min-w-0 truncate ${hi ? "font-hi text-[12.5px]" : "text-[11px] uppercase tracking-[0.16em]"}`}>
                    {plateChapter ? `${String(chapters.indexOf(plateChapter) + 1).padStart(2, "0")} · ${pick(plateChapter, "title", lang)}` : ""}
                  </span>
                  <span className="shrink-0 text-[10.5px]" title={`${plate.title}. ${plate.credit}`}>
                    {plate.credit.split(",")[0]}
                  </span>
                </figcaption>
              </figure>
            ) : null}
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
              onPointerEnter={() => setHovered(plates.findIndex((p) => p.id === c.id) >= 0 ? plates.findIndex((p) => p.id === c.id) : null)}
              onPointerLeave={() => setHovered(null)}
              onFocus={() => setHovered(plates.findIndex((p) => p.id === c.id) >= 0 ? plates.findIndex((p) => p.id === c.id) : null)}
              onBlur={() => setHovered(null)}
              className={`group flex shrink-0 items-center gap-2 rounded-full border border-hair bg-paper/80 py-1.5 pl-1.5 pr-3 text-left text-[12px] text-ink-2 backdrop-blur-sm transition-colors hover:border-ink hover:text-ink ${
                hi ? "font-hi" : ""
              }`}
            >
              <span aria-hidden className={`rounded-full p-1 ${c.track === "tradition" ? "text-tradition" : "text-evidence"}`}>
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
