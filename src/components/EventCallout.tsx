"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { EpicEvent } from "@/content/schema";
import { formatRange, getImage, imageSrc, paragraphs } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { pick, langClass } from "@/lib/text";
import { glyphFor } from "@/lib/timeline";
import { Button } from "@/components/ui/button";
import { DotGlyph } from "./DotGlyph";

type Props = {
  ev: EpicEvent;
  /** Screen position of the pin, so the card sits beside it on wide screens. */
  pin: [number, number];
  /** Progress through this event's slot: draws the glyph, then unfolds the first paragraph. */
  frac: number;
  viewport: { w: number; h: number };
  onOpen: (ev: EpicEvent) => void;
};

const CARD_W = 360;
const CARD_H = 240;

export function EventCallout({ ev, pin, frac, viewport, onOpen }: Props) {
  const { lang } = useLang();
  const img = getImage(ev.image);
  const tradition = ev.track === "tradition";
  const wide = viewport.w >= 1024;
  const more = paragraphs(ev.body)[0];
  const unfolded = frac > 0.42;

  let style: React.CSSProperties;
  if (wide) {
    const [x, y] = pin;
    const left = x < viewport.w / 2 ? x + 44 : x - 44 - CARD_W;
    const top = Math.min(viewport.h - CARD_H - 140, Math.max(150, y - CARD_H / 2));
    style = { position: "fixed", left, top, width: CARD_W };
  } else {
    style = { position: "fixed", left: 12, right: 12, bottom: 96 };
  }

  return (
    <motion.div
      layoutId={`card-${ev.id}`}
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      style={style}
      className="z-20 overflow-hidden rounded-xl border border-hair bg-paper/92 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.45)] backdrop-blur-md"
      onClick={() => onOpen(ev)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen(ev)}
    >
      <div className="flex gap-4 p-4">
        <div className={`shrink-0 ${tradition ? "text-tradition" : "text-evidence"}`}>
          <DotGlyph name={glyphFor(ev)} size={44} progress={Math.min(1, frac / 0.35)} />
        </div>
        <div className="min-w-0 flex-1">
          {img ? (
            <motion.img
              layoutId={`img-${ev.id}`}
              src={imageSrc(img.key)}
              alt=""
              className="float-right ml-3 mb-1 h-16 w-20 rounded-md border border-hair object-cover"
            />
          ) : null}
          <p className={`text-[11px] font-medium uppercase tracking-[0.16em] ${tradition ? "text-tradition" : "text-evidence"}`}>
            {ev.date ? formatRange(ev.date) : ev.tradition_date}
          </p>
          <motion.h3 layoutId={`title-${ev.id}`} className={`${langClass(lang)} mt-1 text-[1.35rem] leading-[1.1] text-ink`}>
            {pick(ev, "title", lang)}
          </motion.h3>
          <p className={`mt-2 line-clamp-3 text-[13.5px] leading-snug text-ink-2 ${lang === "hi" ? "font-hi" : ""}`}>{pick(ev, "summary", lang)}</p>
          {more && wide ? (
            <motion.div
              initial={false}
              animate={{ height: unfolded ? "auto" : 0, opacity: unfolded ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 30 }}
              className="overflow-hidden"
            >
              <p className="mt-2 line-clamp-4 border-t border-hair pt-2 text-[12.5px] leading-snug text-ink-3">{more}</p>
            </motion.div>
          ) : null}
        </div>
      </div>
      <div className="h-px w-full bg-hair">
        <div className={`h-px ${tradition ? "bg-tradition" : "bg-evidence"}`} style={{ width: `${Math.round(frac * 100)}%` }} />
      </div>
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="text-[12px] text-ink-3">{ev.location.name}</span>
        <Button size="xs" variant="ghost" className="text-ink">
          Open
          <ArrowUpRight data-icon="inline-end" />
        </Button>
      </div>
    </motion.div>
  );
}
