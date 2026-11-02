"use client";

import { memo } from "react";
import type { BookChapter, BookEvent } from "@/content/schema";
import { formatYear } from "@/lib/format";
import { useLang } from "@/lib/i18n";
import { SKETCHES } from "@/lib/sketches";
import { LAND, PHONE_SWEEP, STRIPS } from "@/lib/turn";
import { pick, langClass } from "@/lib/text";
import { EventPage } from "./EventCallout";
import { Sketch } from "./Sketch";
import { TurningSheet } from "./TurningSheet";

/** One opening of the book. Hero pages are drawn by Intro, which owns its own turn. */
export type Page = { kind: "opener"; ch: BookChapter; index: number } | { kind: "event"; ch: BookChapter; ev: BookEvent };

/** The left page of a chapter's opening: its number, title and first paragraph. */
export const TitlePage = memo(function TitlePage({ ch, index }: { ch: BookChapter; index: number }) {
  const { lang } = useLang();
  const hi = lang === "hi";
  const lead = hi ? ch.lead_hi : ch.lead;
  const number = String(index + 1).padStart(2, "0");
  return (
    <div className="flex flex-col justify-center lg:h-full">
      <p className={`mb-3 text-ink-2 lg:mb-4 ${hi ? "font-hi text-[13px]" : "text-[11px] font-medium uppercase tracking-[0.22em]"}`}>
        {hi ? `अध्याय ${number}` : `${number} · ${ch.kicker ?? (ch.years ? `${formatYear(ch.years.start)} – ${formatYear(ch.years.end)}` : "")}`}
      </p>
      <h2 className={`${langClass(lang)} text-[clamp(2rem,4.6vw,4.6rem)] leading-[0.98] tracking-[-0.015em] text-ink`}>{pick(ch, "title", lang)}</h2>
      <p className={`mt-3 line-clamp-3 max-w-[50ch] text-[15px] leading-relaxed text-ink-2 [@media(max-height:690px)]:line-clamp-2 lg:mt-5 lg:line-clamp-5 lg:text-[16px] lg:[@media(max-height:690px)]:line-clamp-3 ${hi ? "font-hi" : ""}`}>{lead}</p>
      {ch.track === "tradition" ? (
        <p className={`mt-3 max-w-[50ch] text-ink-3 lg:mt-4 ${hi ? "font-hi text-[12.5px]" : "text-[12px]"}`}>
          {hi ? "पुराणों में वर्णित पारंपरिक कालक्रम। पुरातात्विक या ऐतिहासिक साक्ष्य से इसकी तिथि तय नहीं है।" : "Traditional chronology as described in Puranic texts. Not dated by archaeological or historical evidence."}
        </p>
      ) : null}
    </div>
  );
});

/** Names the work a sketch is traced from, with its maker, licence and a link to the source. */
export function SketchCredit({ id, className = "" }: { id: string; className?: string }) {
  const { lang } = useLang();
  const hi = lang === "hi";
  const source = SKETCHES[id];
  if (!source) return null;
  return (
    <p className={`leading-snug text-ink-3 ${hi ? "text-[12px]" : "text-[11px]"} ${className}`}>
      <span className={hi ? "font-hi" : ""}>{hi ? "इस कृति से रेखांकित: " : "Traced from "}</span>
      <a href={source.page} target="_blank" rel="noreferrer" className={`text-ink-2 underline decoration-hair underline-offset-2 hover:text-ink ${hi ? "font-hi" : ""}`}>
        {hi ? source.title_hi : source.title}
      </a>
      , <span className={hi ? "font-hi" : ""}>{hi ? source.made_hi : source.made}</span>. {source.via}, {source.license}.
    </p>
  );
}

/** The right page of a chapter's opening: its sketch. `instant` shows it whole, for a page already drawn. */
export const SketchPage = memo(function SketchPage({ id, pen, instant = false }: { id: string; pen?: () => number | null; instant?: boolean }) {
  return (
    <figure className="flex h-full flex-col gap-2">
      <div className="min-h-0 flex-1">
        <Sketch id={id} durationMs={instant ? 0 : undefined} pen={pen} />
      </div>
      <figcaption>
        <SketchCredit id={id} />
      </figcaption>
    </figure>
  );
});

function RightOf({ page, onOpen, pen, instant, folio }: { page: Page; onOpen: (e: BookEvent) => void; pen?: () => number | null; instant?: boolean; folio: number }) {
  return page.kind === "opener" ? <SketchPage id={page.ch.id} pen={pen} instant={instant} /> : <EventPage ev={page.ev} onOpen={onOpen} still={instant} folio={folio} />;
}

/** Which page of the book this is, for the stains that make each sheet its own. */
const stainOf = (folio: number) => ((folio % 4) + 4) % 4;

type Props = {
  cur: Page;
  /** The page being turned away, while one is. */
  prev: Page | null;
  /** How far the turn has come, 0 to 1. */
  t: number;
  /** A page number for each page, counted through the book. */
  folio: number;
  /** How far through the whole book the reader is, 0 to 1. */
  done: number;
  wide: boolean;
  reduce: boolean;
  /** The story's clock for the sketch on this page, in Play. */
  pen?: () => number | null;
  onOpen: (e: BookEvent) => void;
};

/**
 * The open book. Wide screens show a spread: the left page is a chapter's title or the map beneath it, the right page a
 * sketch or an event. Phones show one page. Every turn is worked out from the scroll position, so scrolling back un-turns
 * it, and only one transform changes per frame.
 */
export function Book({ cur, prev, t, folio, done, wide, reduce, pen, onOpen }: Props) {
  const turning = !!prev && !reduce;
  // Until the leaf lands the old left page stays in place, so nothing changes under it where the reader can see.
  const left = turning && t < LAND ? prev : cur;
  const turnKey = prev ? (prev.kind === "event" ? prev.ev.id : prev.ch.id) : "";

  if (wide) {
    return (
      <div className="book" data-folio={cur.ch.id}>
        {/* The pages already read pile up on the left, the pages still to come on the right. */}
        <div aria-hidden className="page-stack page-stack-left" style={{ width: 9 + done * 14 }}>
          <i />
        </div>
        <div aria-hidden className="page-stack page-stack-right" style={{ width: 9 + (1 - done) * 14 }}>
          <i />
        </div>
        {left.kind === "opener" ? (
          <div className="page page-left" data-folio={left.ch.id} data-stain={stainOf(folio + 1)}>
            <div className="page-body">
              <TitlePage ch={left.ch} index={left.index} />
            </div>
          </div>
        ) : null}
        <div className="page page-right" data-folio={cur.ch.id} data-stain={stainOf(folio)}>
          <div className="page-body">
            <RightOf page={cur} onOpen={onOpen} pen={pen} folio={folio} />
          </div>
        </div>
        {turning && prev ? (
          <TurningSheet
            key={turnKey}
            t={t}
            strips={STRIPS.wide}
            folio={prev.ch.id}
            className="sheet-leaf"
            back={
              cur.kind === "opener" ? (
                <div className="page leaf-face leaf-verso" data-folio={cur.ch.id} data-stain={stainOf(folio + 1)}>
                  <div className="page-body">
                    <TitlePage ch={cur.ch} index={cur.index} />
                  </div>
                </div>
              ) : undefined
            }
          >
            <div className="page leaf-face" data-folio={prev.ch.id} data-stain={stainOf(folio - 1)}>
              <div className="page-body">
                <RightOf page={prev} onOpen={onOpen} instant folio={folio - 1} />
              </div>
            </div>
          </TurningSheet>
        ) : null}
      </div>
    );
  }

  // A phone has one page, hinged at its left edge. An opener fills it. An event leaves the map showing above its card.
  const openerPage = (page: Extract<Page, { kind: "opener" }>, instant: boolean) => (
    <div className="page page-single" data-folio={page.ch.id} data-stain={stainOf(page.index)}>
      <div className="page-body page-body-single">
        <div className="h-[30svh] shrink-0 [@media(max-height:690px)]:h-[24svh]">
          <SketchPage id={page.ch.id} pen={pen} instant={instant} />
        </div>
        <TitlePage ch={page.ch} index={page.index} />
      </div>
    </div>
  );
  return (
    <>
      <div className="book book-phone">
        {cur.kind === "opener" ? openerPage(cur, false) : <EventPage ev={cur.ev} onOpen={onOpen} folio={folio} />}
        {turning && prev?.kind === "opener" ? (
          <TurningSheet key={turnKey} t={t} strips={STRIPS.phone} sweep={PHONE_SWEEP} folio={prev.ch.id} className="sheet-full">
            {openerPage(prev, true)}
          </TurningSheet>
        ) : null}
      </div>
      {/* Stacked above the map, which turns with it when a chapter's opener lies underneath. */}
      {turning && prev?.kind === "event" ? (
        <div className="book book-phone book-over">
          <TurningSheet key={turnKey} t={t} strips={STRIPS.phone} sweep={PHONE_SWEEP} folio={prev.ch.id} className="sheet-card" fit>
            <EventPage ev={prev.ev} onOpen={onOpen} still folio={folio - 1} />
          </TurningSheet>
        </div>
      ) : null}
    </>
  );
}
