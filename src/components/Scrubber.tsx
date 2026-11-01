"use client";

import { useRef, useState } from "react";
import type { Chapter, EpicEvent } from "@/content/schema";
import { useLang } from "@/lib/i18n";
import { pick } from "@/lib/text";
import { eraFor } from "@/lib/eras";
import { fractionToPosition, positionToFraction, readoutAt, slotAt, type Position } from "@/lib/timeline";

type Props = {
  chapters: Chapter[];
  eventsByChapter: Record<string, EpicEvent[]>;
  pos: Position;
  onSeek: (p: Position) => void;
};

const TICKS = 24;

/** Accent of a chapter's era: the strip reads as the palette of the whole book. */
function accentOf(c: Chapter) {
  const era = eraFor(c);
  return c.track === "tradition" ? era.vars["--tradition"] : era.vars["--evidence"];
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [16, 8, 0].map((s) => {
    const c = ((n >> s) & 255) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function mix(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
/** The year pill: the era accent, deepened toward the ink just enough for its paper-coloured text to reach 4.5:1. */
function pillOf(c: Chapter) {
  const era = eraFor(c);
  const paper = era.vars["--paper"];
  const accent = accentOf(c);
  let bg = accent;
  for (let t = 0.05; contrast(paper, bg) < 4.5 && t <= 0.6; t += 0.05) bg = mix(accent, era.vars["--ink"], t);
  return { bg, fg: paper };
}

/**
 * The scroll bar: one segment per chapter in its era colour, a tick per slot,
 * a dot per event, and a thumb that carries the year. Drag, click, or arrow keys.
 */
export function Scrubber({ chapters, eventsByChapter, pos, onSeek }: Props) {
  const rail = useRef<HTMLDivElement>(null);
  const { lang } = useLang();
  const [hover, setHover] = useState<{ fr: number; label: string } | null>(null);
  const n = chapters.length;
  const f = positionToFraction(pos, n);
  const ch = chapters[pos.chapter];
  const chEvents = ch ? eventsByChapter[ch.id] ?? [] : [];
  const label = ch ? readoutAt(ch, chEvents, pos.progress) : "";
  const activeIdx = ch ? slotAt(pos.progress, chEvents.length).slot - 1 : -1;
  const accent = ch ? accentOf(ch) : "var(--evidence)";
  const pill = ch ? pillOf(ch) : { bg: "var(--evidence)", fg: "var(--paper)" };

  function fractionFromPointer(clientX: number) {
    const r = rail.current?.getBoundingClientRect();
    if (!r) return 0;
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  }
  function labelAt(fr: number) {
    const p = fractionToPosition(fr, n);
    const c = chapters[p.chapter];
    return c ? readoutAt(c, eventsByChapter[c.id] ?? [], p.progress) : "";
  }

  return (
    <div className="mx-auto max-w-[960px] select-none">
      <div
        ref={rail}
        role="slider"
        aria-label="Timeline"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={Number(f.toFixed(3))}
        aria-valuetext={label}
        tabIndex={0}
        className="group relative h-14 cursor-ew-resize touch-none rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          onSeek(fractionToPosition(fractionFromPointer(e.clientX), n));
        }}
        onPointerMove={(e) => {
          const fr = fractionFromPointer(e.clientX);
          if (e.buttons & 1) onSeek(fractionToPosition(fr, n));
          setHover({ fr, label: labelAt(fr) });
        }}
        onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.05 : 0.01;
          let to: Position | null = null;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") to = fractionToPosition(f + step, n);
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") to = fractionToPosition(f - step, n);
          if (e.key === "Home") to = { chapter: 0, progress: 0 };
          if (e.key === "End") to = { chapter: n - 1, progress: 1 };
          if (!to) return;
          // Home/End would otherwise also scroll the page to the hero or the very end.
          e.preventDefault();
          onSeek(to);
        }}
      >
        {/* Era strip: the book's palette, filled up to now. */}
        <div className="absolute inset-x-0 bottom-[18px] flex h-[3px] gap-px">
          {chapters.map((c, ci) => {
            const start = ci / n;
            const end = (ci + 1) / n;
            const fill = Math.max(0, Math.min(1, (f - start) / (end - start)));
            return (
              <div key={c.id} className="relative flex-1 overflow-hidden rounded-full" style={{ background: "var(--hair)" }}>
                <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-150" style={{ width: `${fill * 100}%`, background: accentOf(c) }} />
              </div>
            );
          })}
        </div>

        {/* Ticks and event dots per chapter */}
        <div className="absolute inset-x-0 bottom-[24px] flex h-6 items-end">
          {chapters.map((c, ci) => {
            const evs = eventsByChapter[c.id] ?? [];
            const slots = evs.length + 1;
            const color = accentOf(c);
            return (
              <div key={c.id} className="relative flex h-full flex-1 items-end justify-between px-px">
                {Array.from({ length: TICKS }).map((_, i) => {
                  const tf = (ci + i / TICKS) / n;
                  return (
                    <span
                      key={i}
                      className="w-px transition-colors duration-200"
                      style={{ height: i === 0 ? 14 : i % 6 === 0 ? 9 : 5, background: tf <= f ? color : "var(--hair)", opacity: tf <= f ? 0.9 : 1 }}
                    />
                  );
                })}
                {evs.map((e, i) => {
                  const ef = (ci + (i + 1) / slots) / n;
                  const passed = ef <= f;
                  const isActive = ci === pos.chapter && i === activeIdx;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      tabIndex={-1}
                      aria-label={pick(e, "title", lang)}
                      title={pick(e, "title", lang)}
                      onPointerDown={(ev) => ev.stopPropagation()}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onSeek({ chapter: ci, progress: (i + 1.5) / slots });
                      }}
                      className="absolute -top-1.5 flex h-5 -translate-x-1/2 items-center justify-center rounded-full"
                      // Never wider than the gap to the next dot, or dense chapters (Raj, Company) hit the neighbour.
                      style={{ left: `${((i + 1) / slots) * 100}%`, width: `min(1.25rem, ${100 / slots}%)` }}
                    >
                      <span
                        className={`block rounded-full transition-all duration-200 ${isActive ? "h-3 w-3 ring-2 ring-paper" : "h-1.5 w-1.5"}`}
                        style={{
                          background: e.track === "tradition" ? "var(--tradition)" : color,
                          opacity: passed || isActive ? 1 : 0.35,
                          transform: e.track === "tradition" ? "rotate(45deg)" : undefined,
                          borderRadius: e.track === "tradition" ? 1 : undefined,
                          boxShadow: isActive ? `0 0 0 4px color-mix(in srgb, ${color} 25%, transparent)` : undefined,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Hover preview */}
        {hover && Math.abs(hover.fr - f) > 0.012 ? (
          <>
            <div className="pointer-events-none absolute bottom-[14px] h-4 w-px -translate-x-1/2 bg-ink-3/60" style={{ left: `${hover.fr * 100}%` }} />
            {/* The label slides from left-aligned at the start to right-aligned at the end, so it never leaves the rail. */}
            <div
              className="pointer-events-none absolute bottom-[32px] whitespace-nowrap rounded-full border border-hair bg-paper/95 px-2 py-0.5 text-[10.5px] text-ink-2 backdrop-blur-sm"
              style={{ left: `${hover.fr * 100}%`, transform: `translateX(-${hover.fr * 100}%)` }}
            >
              {hover.label}
            </div>
          </>
        ) : null}

        {/* Thumb: a line through the strip and the year riding on it. */}
        <div className="pointer-events-none absolute bottom-[8px] -translate-x-1/2" style={{ left: `${f * 100}%` }}>
          <div className="mx-auto h-9 w-[2px] rounded-full" style={{ background: accent }} />
          <div
            className="absolute bottom-[15px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-paper shadow-sm transition-transform duration-150 group-hover:scale-125 group-focus-visible:scale-125"
            style={{ background: accent }}
          />
        </div>
        {/* The year rides the thumb, sliding from left- to right-aligned so it stays on screen at both ends. */}
        <div
          className="pointer-events-none absolute bottom-[46px] whitespace-nowrap rounded-full px-2.5 py-1 font-display text-[12px] tabular-nums shadow-sm"
          style={{ left: `${f * 100}%`, transform: `translateX(-${f * 100}%)`, background: pill.bg, color: pill.fg }}
        >
          {label}
        </div>
      </div>

      {/* Chapter row: numbers, the active one named in its era colour. */}
      <div className="flex text-[10px] uppercase tracking-[0.14em] text-ink-3">
        {chapters.map((c, i) => {
          const on = i === pos.chapter;
          const color = accentOf(c);
          return (
            <button
              key={c.id}
              onClick={() => onSeek({ chapter: i, progress: 0 })}
              className={`min-w-0 truncate border-l pl-1.5 text-left outline-none transition-[flex,color] duration-300 hover:text-ink focus-visible:bg-paper-2 focus-visible:text-ink ${on ? "flex-[4]" : "flex-1"} ${
                lang === "hi" ? "font-hi normal-case tracking-normal" : ""
              }`}
              style={{ borderColor: on ? color : "var(--hair)", color: on ? color : undefined }}
              title={pick(c, "title", lang)}
              aria-current={on ? "step" : undefined}
            >
              {on ? (
                <span>
                  {String(i + 1).padStart(2, "0")} · {c.kicker ?? pick(c, "title", lang)}
                </span>
              ) : (
                <span>{String(i + 1).padStart(2, "0")}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
