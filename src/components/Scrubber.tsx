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

/**
 * The scroll bar: one segment per chapter in its era colour, a tick per slot,
 * a dot per event, and a thumb that carries the year. Drag, click, or arrow keys.
 */
export function Scrubber({ chapters, eventsByChapter, pos, onSeek }: Props) {
  const rail = useRef<HTMLDivElement>(null);
  const { lang } = useLang();
  const [hover, setHover] = useState<{ x: number; label: string } | null>(null);
  const n = chapters.length;
  const f = positionToFraction(pos, n);
  const ch = chapters[pos.chapter];
  const chEvents = ch ? eventsByChapter[ch.id] ?? [] : [];
  const label = ch ? readoutAt(ch, chEvents, pos.progress) : "";
  const activeIdx = ch ? slotAt(pos.progress, chEvents.length).slot - 1 : -1;
  const accent = ch ? accentOf(ch) : "var(--evidence)";

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
        className="group relative h-14 cursor-ew-resize touch-none outline-none"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          onSeek(fractionToPosition(fractionFromPointer(e.clientX), n));
        }}
        onPointerMove={(e) => {
          const fr = fractionFromPointer(e.clientX);
          if (e.buttons & 1) onSeek(fractionToPosition(fr, n));
          const r = rail.current?.getBoundingClientRect();
          if (r) setHover({ x: fr * r.width, label: labelAt(fr) });
        }}
        onPointerLeave={() => setHover(null)}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 0.05 : 0.01;
          if (e.key === "ArrowRight") onSeek(fractionToPosition(f + step, n));
          if (e.key === "ArrowLeft") onSeek(fractionToPosition(f - step, n));
          if (e.key === "Home") onSeek({ chapter: 0, progress: 0 });
          if (e.key === "End") onSeek({ chapter: n - 1, progress: 1 });
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
                      className="absolute -top-1.5 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full"
                      style={{ left: `${((i + 1) / slots) * 100}%` }}
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
        {hover && Math.abs(hover.x / (rail.current?.getBoundingClientRect().width ?? 1) - f) > 0.012 ? (
          <div className="pointer-events-none absolute bottom-[14px] -translate-x-1/2" style={{ left: hover.x }}>
            <div className="mx-auto h-4 w-px bg-ink-3/60" />
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-hair bg-paper/95 px-2 py-0.5 text-[10.5px] text-ink-2 backdrop-blur-sm">
              {hover.label}
            </div>
          </div>
        ) : null}

        {/* Thumb: a line through the strip and the year riding on it. */}
        <div className="pointer-events-none absolute bottom-[8px] -translate-x-1/2" style={{ left: `${f * 100}%` }}>
          <div className="mx-auto h-9 w-[2px] rounded-full" style={{ background: accent }} />
          <div
            className="absolute bottom-[15px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-paper shadow-sm transition-transform duration-150 group-hover:scale-125"
            style={{ background: accent }}
          />
          <div
            className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-1 font-display text-[12px] tabular-nums text-paper shadow-sm"
            style={{ background: accent }}
          >
            {label}
          </div>
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
              className={`min-w-0 truncate border-l pl-1.5 text-left transition-[flex,color] duration-300 hover:text-ink ${on ? "flex-[4]" : "flex-1"} ${
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
