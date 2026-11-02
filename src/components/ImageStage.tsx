"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import type { ImageEntry } from "@/content/schema";
import { imagePath } from "@/lib/format";

type Props = {
  /** The picture: gets a slow push-in, a drift and a reveal. */
  entry: ImageEntry;
  className?: string;
  caption?: boolean;
  /** Portrait on cards, landscape on chapter openers. */
  ratio?: "card" | "wide";
};

export function ImageStage({ entry: first, className = "", caption = true, ratio = "wide" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.06, 1.18]);
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [24, -24]);
  const clip = useTransform(scrollYProgress, [0, 0.28], reduce ? ["inset(0% 0% 0% 0%)", "inset(0% 0% 0% 0%)"] : ["inset(0% 0% 14% 0%)", "inset(0% 0% 0% 0%)"]);

  const aspect = ratio === "wide" ? "aspect-[16/10]" : "aspect-[4/5]";

  return (
    <figure ref={ref} className={`relative ${className}`}>
      <motion.div style={{ clipPath: clip }} className={`relative overflow-hidden rounded-[4px] bg-paper-2 ${aspect}`}>
        <motion.img
          src={imagePath(first)}
          alt={first.title}
          style={{ scale, y }}
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          loading="lazy"
          decoding="async"
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[4px]" />
      </motion.div>
      {caption ? (
        <figcaption className="mt-2 text-[11px] leading-tight text-ink-3">
          {first.title}. {first.author},{" "}
          {first.licenseUrl ? (
            <a href={first.licenseUrl} className="underline decoration-hair underline-offset-2 hover:text-ink-2" target="_blank" rel="noreferrer">
              {first.license}
            </a>
          ) : (
            first.license
          )}
          , via{" "}
          <a href={first.source} className="underline decoration-hair underline-offset-2 hover:text-ink-2" target="_blank" rel="noreferrer">
            Wikimedia Commons
          </a>
          .
        </figcaption>
      ) : null}
    </figure>
  );
}
