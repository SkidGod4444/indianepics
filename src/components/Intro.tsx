"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, Pause, Play } from "lucide-react";
import type { BookChapter } from "@/content/schema";
import { useLang } from "@/lib/i18n";
import { pick } from "@/lib/text";
import { BASE_ERA } from "@/lib/eras";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { SketchCredit } from "./Book";
import { TurningSheet } from "./TurningSheet";
import { LAND, PHONE_SWEEP, STRIPS } from "@/lib/turn";
import { Sketch, loadSketch } from "./Sketch";

type Props = {
  chapters: BookChapter[];
  onPlay: () => void;
  onSeek: (chapterIndex: number) => void;
  playing?: boolean;
  /** How far this page has turned, 0 to 1. */
  turn: number;
  wide: boolean;
  reduce: boolean;
  /** The story's clock for the opening sketch, while the prologue is read. */
  pen?: () => number | null;
};

/** How long the hero holds each sketch, drawing included, before walking on to the next era. */
const HOLD_MS = 9500;
const DRAW_MS = 7000;

/**
 * The title page. It stays where it is and turns: the wide spread swings its right page over the spine, a phone's single
 * page swings away at its left edge. The section's own height in the flow is the stretch of scroll that does it.
 */
export const Intro = memo(function Intro({ chapters, onPlay, onSeek, playing = false, turn, wide, reduce, pen }: Props) {
  const { lang } = useLang();
  const hi = lang === "hi";
  const onScreen = turn < 1;

  // The opening sketch, then one for each chapter. A chapter under the pointer takes over.
  const scenes = useMemo(() => ["hero", ...chapters.map((c) => c.id)], [chapters]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [auto, setAuto] = useState(0);
  // Play opens on the first sketch, and a pause stays on it.
  const [wasPlaying, setWasPlaying] = useState(playing);
  if (playing !== wasPlaying) {
    setWasPlaying(playing);
    if (playing) setAuto(0);
  }
  useEffect(() => {
    if (reduce || hovered !== null || !onScreen || playing) return;
    const id = window.setInterval(() => setAuto((a) => (a + 1) % scenes.length), HOLD_MS);
    return () => window.clearInterval(id);
  }, [reduce, hovered, onScreen, playing, scenes.length]);
  const index = playing ? 0 : hovered !== null ? hovered + 1 : auto;
  const scene = scenes[index] ?? "hero";
  useEffect(() => {
    void loadSketch(scenes[(index + 1) % scenes.length]).catch(() => {});
  }, [scenes, index]);

  const turning = !reduce && turn > 0 && turn < 1;
  const landed = turn >= LAND;
  // The sheet that turns is a copy of what was on the page: the sketch side on a wide screen, all of it on a phone.
  const [artPage, setArtPage] = useState<HTMLElement | null>(null);
  const [wholePage, setWholePage] = useState<HTMLElement | null>(null);
  const rise = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

  return (
    <>
    <section className="relative h-svh" style={{ visibility: turning && !wide ? "hidden" : undefined }}>
      <div
        ref={setWholePage}
        className="hero-sheet page"
        data-stain="1"
        inert={turn > 0.02}
        style={{
          visibility: turn >= 1 ? "hidden" : undefined,
          opacity: reduce ? 1 - turn : undefined,
        }}
      >
          <div className="hero-text page flex flex-col" data-stain="0" style={{ visibility: wide && landed && !reduce ? "hidden" : undefined }}>
            <motion.div {...rise} transition={{ duration: 0.6 }} className="mb-3 lg:mb-6">
              <Logo href="" domain mark={false} size="lg" />
              <p className={`mt-2 hidden text-ink-2 lg:block ${hi ? "font-hi text-[13px]" : "text-[11px] uppercase tracking-[0.2em]"}`}>
                {hi ? "भारत का इतिहास, एक नक़्शे पर" : "The history of India, on one map"}
              </p>
            </motion.div>
            <motion.h1
              {...rise}
              transition={{ duration: 0.7, delay: 0.1 }}
              // Pinned to the base type setting: an era's heavier face would rewrap the headline and shift every seek.
              style={
                {
                  "--display-opsz": BASE_ERA.display.opsz,
                  "--display-soft": BASE_ERA.display.soft,
                  "--display-weight": BASE_ERA.display.weight,
                } as React.CSSProperties
              }
              className={`${hi ? "font-hi" : "font-display"} text-[clamp(2.4rem,5.4vw,5.4rem)] leading-[0.98] tracking-[-0.02em] text-ink [text-wrap:balance]`}
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
            <motion.p {...rise} transition={{ duration: 0.7, delay: 0.2 }} className={`order-1 mt-4 line-clamp-3 max-w-[50ch] text-[15px] leading-relaxed text-ink-2 [@media(max-height:690px)]:hidden lg:order-none lg:mt-5 lg:line-clamp-none lg:text-[17px] lg:[@media(max-height:690px)]:block ${hi ? "font-hi" : ""}`}>
              {hi
                ? "सतयुग से आज की सुबह तक, एक ही नक़्शे पर। रामायण और महाभारत का कहा हुआ समय, और मुहरों, शिलालेखों और संधियों का दिनांकित इतिहास, साथ-साथ। एक आवाज़ कहानी सुनाती है।"
                : "From the Satya Yuga to this morning, on a single map. The told time of the Ramayana and the Mahabharata runs beside the dated record of seals, edicts and treaties, and a voice carries you through it."}
            </motion.p>
            <motion.div {...rise} transition={{ duration: 0.6, delay: 0.32 }} className="mt-5 flex flex-wrap items-center gap-3 lg:mt-7">
              <Button size="lg" onClick={onPlay} aria-pressed={playing} className="h-12 rounded-full pl-5 pr-6 text-[15px]">
                <span className="mr-1 grid h-6 w-6 place-items-center rounded-full bg-paper/15">
                  {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5 translate-x-px" />}
                </span>
                <span className="flex flex-col items-start leading-none">
                  <span>{playing ? (hi ? "रोकें" : "Pause") : hi ? "कहानी सुनें" : "Play the story"}</span>
                  <span className={`mt-1 text-[10.5px] font-normal text-paper/70 ${hi ? "font-hi" : "uppercase tracking-[0.14em]"}`}>{hi ? "कथन के साथ" : "Narrated"}</span>
                </span>
              </Button>
              <Button size="lg" variant="outline" onClick={() => onSeek(0)} className="h-12 rounded-full bg-transparent px-6 text-[15px]">
                <ArrowDown data-icon="inline-start" />
                {hi ? "अपनी गति से पढ़ें" : "Read at your own pace"}
              </Button>
            </motion.div>
          </div>

          <div className="hero-art" style={{ visibility: turning && wide ? "hidden" : undefined }}>
            <figure ref={setArtPage} className="hero-front page" data-stain="2">
              <div className="relative h-[30svh] lg:h-[64svh] lg:w-full">
                <AnimatePresence mode="wait">
                  <motion.div key={scene} exit={{ opacity: 0, transition: { duration: 0.35 } }} className="absolute inset-0">
                    <Sketch id={scene} durationMs={DRAW_MS} pen={scene === "hero" ? pen : undefined} />
                  </motion.div>
                </AnimatePresence>
              </div>
            <figcaption className="mt-1 text-right lg:mt-2">
              <SketchCredit id={scene} />
            </figcaption>
            </figure>
          </div>
          {turning && wide ? <TurningSheet t={turn} strips={STRIPS.wide} copy={artPage} folio="itihasa" className="sheet-leaf" /> : null}

        {/* One column per chapter. Hovering shows its sketch, a click goes there. */}
        <nav
          aria-label="Chapters"
          data-no-swipe
          style={{ opacity: Math.max(0, 1 - turn * 4) }}
          className="hero-nav -mx-5 mt-auto flex gap-4 overflow-x-auto px-5 pb-1 lg:mx-0 lg:grid lg:grid-cols-9 lg:gap-3 lg:overflow-visible lg:px-0 [scrollbar-width:none]"
        >
          {chapters.map((c, i) => {
            const on = index === i + 1;
            return (
              <button
                key={c.id}
                onClick={() => onSeek(i)}
                onPointerEnter={() => setHovered(i)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                className={`group relative w-[136px] shrink-0 border-t pt-2.5 text-left transition-colors lg:w-auto ${on ? "border-ink text-ink" : "border-hair text-ink-2 hover:border-ink hover:text-ink"} ${hi ? "font-hi" : ""}`}
              >
                <span className="block text-[10.5px] tabular-nums text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-0.5 block text-[12.5px] leading-snug">{pick(c, "title", lang)}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </section>
    {turning && !wide ? (
      <div className="book book-phone book-over">
        <TurningSheet t={turn} strips={STRIPS.phone} sweep={PHONE_SWEEP} copy={wholePage} folio="itihasa" className="sheet-full" />
      </div>
    ) : null}
    </>
  );
});
