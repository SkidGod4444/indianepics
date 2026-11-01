"use client";

import { motion } from "motion/react";
import { useLang } from "@/lib/i18n";

export function Intro({ chapterCount, eventCount }: { chapterCount: number; eventCount: number }) {
  const { lang } = useLang();
  const hi = lang === "hi";
  return (
    <section className="relative z-[2] flex min-h-[100svh] flex-col justify-end overflow-hidden px-5 pb-16 pt-28 lg:px-10">
      <div className="relative z-10 max-w-[760px] rounded-2xl bg-paper/70 p-6 backdrop-blur-md lg:p-8">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-3"
        >
          A scroll-driven atlas · {chapterCount} chapters · {eventCount} pins · open data
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className={`${hi ? "font-hi" : "font-display"} text-[clamp(3rem,9vw,7.5rem)] leading-[0.95] tracking-[-0.02em] text-ink`}
        >
          {hi ? "सतयुग से आज तक" : "From the Satya Yuga to this morning."}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className={`mt-6 max-w-[56ch] text-[17px] leading-relaxed text-ink-2 ${hi ? "font-hi" : ""}`}
        >
          {hi
            ? "एक नक़्शा, दो धाराएँ। इतिहास-पुराण की परंपरा और पुरातत्व के प्रमाण, एक ही स्क्रॉल पर, अलग-अलग पैमानों पर।"
            : "One map, two tracks. The Itihasa-Purana tradition and the archaeological record share a scroll, never a scale. Scroll to move through time; the map, the empires and the pins follow."}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 flex items-center gap-3 text-[12px] text-ink-3"
        >
          <span className="inline-block h-6 w-px animate-pulse bg-ink-3" />
          Scroll
        </motion.div>
      </div>
      <div className="pointer-events-none absolute -right-[10%] top-[10%] h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(closest-side,var(--evidence-soft),transparent_70%)] opacity-50" />
    </section>
  );
}
