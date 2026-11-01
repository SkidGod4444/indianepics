"use client";

import { useRef } from "react";
import type { Chapter, EpicEvent } from "@/content/schema";
import { useLang } from "@/lib/i18n";
import { pick } from "@/lib/text";
import { fractionToPosition, positionToFraction, readoutAt, type Position } from "@/lib/timeline";

type Props = {
  chapters: Chapter[];
  eventsByChapter: Record<string, EpicEvent[]>;
  pos: Position;
  onSeek: (p: Position) => void;
};

const TICKS = 24;

export function Scrubber({ chapters, eventsByChapter, pos, onSeek }: Props) {
  const rail = useRef<HTMLDivElement>(null);
  const { lang } = useLang();
  const n = chapters.length;
  const f = positionToFraction(pos, n);
  const ch = chapters[pos.chapter];
  const label = ch ? readoutAt(ch, eventsByChapter[ch.id] ?? [], pos.progress) : "";

  function seekFromPointer(clientX: number) {
    const r = rail.current?.getBoundingClientRect();
    if (!r) return;
    onSeek(fractionToPosition((clientX - r.left) / r.width, n));
  }

  return (
    <div className="mx-auto max-w-[920px] select-none">
      <div
        ref={rail}
        role="slider"
        aria-label="Timeline"
        aria-valuemin={0}
        aria-valuemax={1}
        aria-valuenow={Number(f.toFixed(3))}
        aria-valuetext={label}
        tabIndex={0}
        className="relative h-12 cursor-ew-resize touch-none"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          seekFromPointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons & 1) seekFromPointer(e.clientX);
        }}
        onKeyDown={(e) => {
          const step = 0.01;
          if (e.key === "ArrowRight") onSeek(fractionToPosition(f + step, n));
          if (e.key === "ArrowLeft") onSeek(fractionToPosition(f - step, n));
        }}
      >
        <div className="absolute inset-x-0 bottom-3 flex h-5 items-end">
          {chapters.map((c, ci) => {
            const evs = eventsByChapter[c.id] ?? [];
            const slots = evs.length + 1;
            return (
              <div key={c.id} className="relative flex h-full flex-1 items-end justify-between border-l border-hair pl-px last:border-r">
                {Array.from({ length: TICKS }).map((_, i) => {
                  const tf = (ci + i / TICKS) / n;
                  const passed = tf <= f;
                  return (
                    <span
                      key={i}
                      className="w-px"
                      style={{
                        height: i % 6 === 0 ? 14 : 8,
                        background: passed ? (c.track === "tradition" ? "var(--tradition)" : "var(--evidence)") : "var(--hair)",
                      }}
                    />
                  );
                })}
                {/* event markers */}
                {evs.map((e, i) => (
                  <span
                    key={e.id}
                    className="absolute -top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
                    style={{
                      left: `${((i + 1) / slots) * 100}%`,
                      background: e.track === "tradition" ? "var(--tradition)" : "var(--evidence)",
                      opacity: (ci + (i + 1) / slots) / n <= f ? 1 : 0.35,
                    }}
                    title={e.title}
                  />
                ))}
              </div>
            );
          })}
        </div>
        <div className="pointer-events-none absolute bottom-1 -translate-x-1/2" style={{ left: `${f * 100}%` }}>
          <div className="mx-auto h-7 w-px bg-ink" />
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium text-paper">
            {label}
          </div>
        </div>
      </div>
      <div className="flex text-[10px] uppercase tracking-[0.14em] text-ink-3">
        {chapters.map((c, i) => {
          const on = i === pos.chapter;
          return (
            <button
              key={c.id}
              onClick={() => onSeek({ chapter: i, progress: 0 })}
              className={`min-w-0 truncate border-l border-hair pl-1.5 text-left transition-[flex] duration-300 hover:text-ink ${
                on ? "flex-[4] text-ink" : "flex-1"
              } ${lang === "hi" ? "font-hi normal-case tracking-normal" : ""}`}
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
