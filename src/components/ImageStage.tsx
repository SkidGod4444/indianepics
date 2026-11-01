"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "motion/react";
import { getImage, imageSrc } from "@/lib/content";

type Layer = { image: string; depth: number };

type Props = {
  /** Single flat image: gets a slow push-in, a drift, and a reveal. */
  image?: string;
  /** Layered art, back to front. Each layer drifts by its depth. Drop these in and parallax works. */
  layers?: Layer[];
  className?: string;
  caption?: boolean;
  /** Portrait on cards, landscape on chapter openers. */
  ratio?: "card" | "wide";
};

export function ImageStage({ image, layers, className = "", caption = true, ratio = "wide" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.06, 1.18]);
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [24, -24]);
  const clip = useTransform(scrollYProgress, [0, 0.28], reduce ? ["inset(0% 0% 0% 0%)", "inset(0% 0% 0% 0%)"] : ["inset(0% 0% 14% 0%)", "inset(0% 0% 0% 0%)"]);

  const first = getImage(layers?.[layers.length - 1]?.image ?? image);
  const aspect = ratio === "wide" ? "aspect-[16/10]" : "aspect-[4/5]";

  return (
    <figure ref={ref} className={`relative ${className}`}>
      <motion.div style={{ clipPath: clip }} className={`relative overflow-hidden rounded-[4px] bg-paper-2 ${aspect}`}>
        {layers?.length ? (
          layers.map((l, i) => <ParallaxLayer key={l.image + i} layer={l} progress={scrollYProgress} reduce={!!reduce} />)
        ) : first ? (
          <motion.img
            src={imageSrc(first.key)}
            alt={first.title}
            style={{ scale, y }}
            className="absolute inset-0 h-full w-full object-cover will-change-transform"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <Placeholder label={image ?? "image"} />
        )}
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[4px]" />
      </motion.div>
      {caption && first ? (
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

function ParallaxLayer({ layer, progress, reduce }: { layer: Layer; progress: MotionValue<number>; reduce: boolean }) {
  const range = reduce ? 0 : 80 * layer.depth;
  const y = useTransform(progress, [0, 1], [range, -range]);
  const src = imageSrc(layer.image);
  if (!src) return null;
  return <motion.img src={src} alt="" style={{ y, scale: 1 + layer.depth * 0.12 }} className="absolute inset-0 h-full w-full object-cover will-change-transform" />;
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,transparent_0_14px,color-mix(in_oklab,var(--hair)_60%,transparent)_14px_15px)]">
      <span className="rounded-full border hairline bg-paper px-3 py-1 text-[11px] text-ink-3">image pending · {label}</span>
    </div>
  );
}
