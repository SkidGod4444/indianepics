"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { BookEvent } from "@/content/schema";
import { formatRange, pageImagePath } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { pick, langClass } from "@/lib/text";
import { glyphFor } from "@/lib/timeline";
import { buttonVariants } from "@/components/ui/button";
import { DotGlyph } from "./DotGlyph";

type Props = {
  ev: BookEvent;
  onOpen: (ev: BookEvent) => void;
  /** A copy on a turning leaf: no shared-layout ids, and it takes no clicks. */
  still?: boolean;
  folio: number;
  style?: React.CSSProperties;
};

/** Phones: the card sits above the scrubber and its year label. Stage fits the map into the space above it. */
export const BOTTOM_NARROW = 104;

/**
 * One event as a page of the book. On a wide screen it fills the right page, beside the map on the left. On a phone it is
 * a leaf at the foot of the map. Only the event changes it, so scrolling never re-renders it.
 */
export const EventPage = memo(function EventPage({ ev, onOpen, still = false, folio, style }: Props) {
  const { lang } = useLang();
  const hi = lang === "hi";
  const tradition = ev.track === "tradition";
  // The long text is English only: a Hindi page keeps to its Hindi summary.
  const more = hi ? undefined : ev.lead;
  const shared = (name: string) => (still ? {} : { layoutId: `${name}-${ev.id}` });
  // A turning copy is plain markup: nothing in it animates, and it re-renders on every frame of the turn.
  const Card = (still ? "div" : motion.div) as "div";
  const Title = (still ? "h3" : motion.h3) as "h3";
  const Img = (still ? "img" : motion.img) as "img";

  return (
    <Card
      {...shared("card")}
      data-folio={ev.chapter}
      style={style}
      className={`event-page group flex flex-col outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${still ? "pointer-events-none" : "cursor-pointer"}`}
      onClick={still ? undefined : () => onOpen(ev)}
      role={still ? undefined : "button"}
      tabIndex={still ? undefined : 0}
      aria-hidden={still || undefined}
      aria-label={still ? undefined : `${pick(ev, "title", lang)}. Open`}
      onKeyDown={
        still
          ? undefined
          : (e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              if (!e.repeat) onOpen(ev);
            }
      }
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 ${tradition ? "text-tradition" : "text-evidence"}`}>
          <DotGlyph name={glyphFor(ev)} size={40} progress={1} />
        </div>
        <div className="min-w-0">
          <p className={`text-[11px] font-medium uppercase tracking-[0.16em] ${tradition ? "text-tradition" : "text-evidence"}`}>
            {ev.date ? formatRange(ev.date) : ev.tradition_date}
          </p>
          <Title {...shared("title")} className={`${langClass(lang)} mt-1 text-[clamp(1.35rem,2.5vw,2.3rem)] leading-[1.08] text-ink`}>
            {pick(ev, "title", lang)}
          </Title>
        </div>
      </div>
      <p className={`mt-3 line-clamp-3 text-ink-2 lg:line-clamp-none lg:text-[17px] ${hi ? "font-hi text-[13.5px] leading-[1.6]" : "page-initial text-[13.5px] leading-snug lg:leading-relaxed"}`}>
        {pick(ev, "summary", lang)}
      </p>
      {ev.image ? (
        <Img
          {...shared("img")}
          src={pageImagePath(ev.image)}
          alt=""
          decoding="async"
          // Hidden on phones, and a lazy image that is not displayed is never fetched.
          loading="lazy"
          className="mt-4 hidden min-h-0 w-full flex-1 basis-0 rounded-[2px] border border-hair object-cover lg:block lg:max-h-[32svh]"
        />
      ) : null}
      {more ? <p className="mt-4 hidden text-[14.5px] leading-relaxed text-ink-2 lg:line-clamp-3 lg:[display:-webkit-box]">{more}</p> : null}
      <div className="mt-3 flex shrink-0 items-center justify-between border-t border-hair pt-2 lg:mt-auto">
        <span className="text-[12px] text-ink-3">
          {ev.location.name}
          <span className="hidden lg:inline"> · {hi ? `पृष्ठ ${folio}` : `folio ${folio}`}</span>
        </span>
        {/* The whole page is the button; this is its label, not a second control nested inside it. */}
        <span aria-hidden className={buttonVariants({ size: "xs", variant: "ghost", className: "text-ink" })}>
          {hi ? "पूरा पढ़ें" : "Read the page"}
          <ArrowUpRight data-icon="inline-end" />
        </span>
      </div>
    </Card>
  );
});
