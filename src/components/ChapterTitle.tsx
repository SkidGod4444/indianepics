"use client";

import { motion } from "motion/react";
import type { Chapter } from "@/content/schema";
import { formatYear, paragraphs } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { pick, langClass } from "@/lib/text";
import { sceneForChapter } from "@/lib/scenes";
import { DotScene } from "./DotScene";

/** Centre-stage chapter opener, shown during the chapter's title slot. */
export function ChapterTitle({ ch, index, frac }: { ch: Chapter; index: number; frac: number }) {
  const { lang } = useLang();
  const tradition = ch.track === "tradition";
  const color = tradition ? "text-tradition" : "text-evidence";
  const body = paragraphs(ch.body);
  return (
    <motion.div
      key={ch.id}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="pointer-events-none fixed inset-x-0 top-1/2 z-20 mx-auto flex max-w-[680px] -translate-y-1/2 flex-col items-center px-6 text-center"
    >
      <div className={`${color} relative mb-3 w-[min(520px,84vw,56vh)] before:absolute before:-inset-[12%] before:-z-10 before:rounded-[50%] before:bg-[radial-gradient(closest-side,var(--paper)_55%,transparent)] before:opacity-90`}>
        <DotScene name={sceneForChapter(ch.id, ch.track)} progress={Math.min(1, frac / 0.6)} className="block h-auto w-full" />
      </div>
      <p className={`mb-3 text-[11px] font-medium uppercase tracking-[0.2em] ${color}`}>
        {String(index + 1).padStart(2, "0")} · {ch.kicker ?? (ch.years ? `${formatYear(ch.years.start)} – ${formatYear(ch.years.end)}` : "")}
      </p>
      <h2 className={`${langClass(lang)} text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.98] tracking-[-0.015em] text-ink [text-shadow:0_1px_0_var(--paper),0_0_24px_var(--paper)]`}>
        {pick(ch, "title", lang)}
      </h2>
      <motion.p
        animate={{ opacity: frac < 0.75 ? 1 : 0.4 }}
        className="mt-4 line-clamp-3 max-w-[52ch] rounded-xl bg-paper/80 px-4 py-3 text-[14px] leading-relaxed text-ink-2 backdrop-blur-md"
      >
        {body[0]}
      </motion.p>
      <motion.p animate={{ opacity: frac < 0.6 ? 1 : 0 }} className="mt-4 text-[11px] uppercase tracking-[0.2em] text-ink-3">Keep scrolling to draw the chapter</motion.p>
    </motion.div>
  );
}
