"use client";

import { useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { interpolate } from "flubber";
import type { GeoProjection } from "d3-geo";
import type { Chapter, EpicEvent, Polity } from "@/content/schema";
import { countries, pathFor, ringToFeature } from "@/lib/geo";
import type { Position } from "@/lib/timeline";
import { pick } from "@/lib/text";
import { useLang } from "@/lib/i18n";

type Props = {
  size: { w: number; h: number };
  projection: GeoProjection;
  chapters: Chapter[];
  polities: Polity[];
  /** Events of the current chapter that have been revealed, in order. */
  visible: EpicEvent[];
  pos: Position;
  /** Progress through the current slot; the thread catches up to the active pin over it. */
  frac: number;
  activeEventId: string | null;
  onPick: (ev: EpicEvent) => void;
};

const MORPH_WINDOW = 0.22;

export function MapStage({ size, projection, chapters, polities, visible, pos, frac, activeEventId, onPick }: Props) {
  const { lang } = useLang();
  const reduce = useReducedMotion();
  const path = useMemo(() => pathFor(projection), [projection]);

  const countryPaths = useMemo(
    () => countries.features.map((f) => ({ name: f.properties.name, d: path(f) ?? "" })),
    [path],
  );
  // The geometry is cut to a box (55–105°E, up to ~42.6°N). Feather its west, east and north edges
  // into the water so the land never ends in a ruled line on wide screens.
  const edge = useMemo(() => {
    const [[x0, y0], [x1, y1]] = path.bounds(countries);
    return { x0, y0, x1, y1, f: Math.max(40, Math.min(120, (x1 - x0) * 0.1)) };
  }, [path]);

  const polityPath = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of polities) m.set(p.id, path(ringToFeature(p)) ?? "");
    return m;
  }, [polities, path]);

  const morphs = useMemo(() => {
    const m = new Map<number, (t: number) => string>();
    for (let i = 1; i < chapters.length; i++) {
      const a = chapters[i - 1].polity && polityPath.get(chapters[i - 1].polity!);
      const b = chapters[i].polity && polityPath.get(chapters[i].polity!);
      if (a && b) m.set(i, interpolate(a, b, { maxSegmentLength: 6 }));
    }
    return m;
  }, [chapters, polityPath]);

  const ch = chapters[pos.chapter];
  const prev = chapters[pos.chapter - 1];
  const curPolity = ch?.polity ? polityPath.get(ch.polity) : undefined;
  const morph = morphs.get(pos.chapter);
  const t = Math.min(1, pos.progress / MORPH_WINDOW);
  const d = morph && t < 1 ? morph(t) : curPolity;
  const polityOpacity = curPolity ? (prev?.polity ? 1 : Math.min(1, pos.progress / 0.12)) : 0;
  const polityMeta = ch?.polity ? polities.find((p) => p.id === ch.polity) : undefined;
  const polityLabel = polityMeta && t >= 1 ? pick(polityMeta, "name", lang) : "";
  const trackColor = ch?.track === "tradition" ? "var(--tradition)" : "var(--evidence)";

  // The story thread: a dotted route through the pins in order, drawn up to the active one as the slot scrolls.
  const thread = useMemo(() => {
    const pts = visible.map((e) => projection([e.location.lng, e.location.lat]) ?? [0, 0]);
    if (pts.length < 2) return "";
    const k = Math.min(1, frac / 0.6);
    const e = 1 - Math.pow(1 - k, 3);
    const [ax, ay] = pts[pts.length - 2];
    const [bx, by] = pts[pts.length - 1];
    const head = [ax + (bx - ax) * e, ay + (by - ay) * e];
    return [...pts.slice(0, -1), head].map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  }, [visible, projection, frac]);

  return (
    <div className="relative h-full w-full">
      <svg viewBox={`0 0 ${size.w} ${size.h}`} width={size.w} height={size.h} className="block h-full w-full">
        <defs>
          <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" stroke={trackColor} strokeWidth="0.8" opacity="0.35" />
          </pattern>
          <linearGradient id="fade-w" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="var(--water)" stopOpacity="1" className="era-stop" />
            <stop offset="1" stopColor="var(--water)" stopOpacity="0" className="era-stop" />
          </linearGradient>
          <linearGradient id="fade-e" x1="1" x2="0" y1="0" y2="0">
            <stop offset="0" stopColor="var(--water)" stopOpacity="1" className="era-stop" />
            <stop offset="1" stopColor="var(--water)" stopOpacity="0" className="era-stop" />
          </linearGradient>
          <linearGradient id="fade-n" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--water)" stopOpacity="1" className="era-stop" />
            <stop offset="1" stopColor="var(--water)" stopOpacity="0" className="era-stop" />
          </linearGradient>
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="60%" stopColor="var(--paper)" stopOpacity="0" className="era-stop" />
            <stop offset="100%" stopColor="var(--paper)" stopOpacity="0.9" className="era-stop" />
          </radialGradient>
        </defs>
        <rect width={size.w} height={size.h} fill="var(--water)" className="era-fill" />
        <g>
          {countryPaths.map((c) => (
            <path
              key={c.name}
              d={c.d}
              fill="var(--land)"
              stroke="var(--land-stroke)"
              className="era-fill"
              strokeWidth={c.name === "India" ? 0.9 : 0.6}
              strokeLinejoin="round"
            />
          ))}
        </g>
        <g pointerEvents="none">
          <rect x={edge.x0 - 1} y={edge.y0 - 1} width={edge.f} height={edge.y1 - edge.y0 + 2} fill="url(#fade-w)" />
          <rect x={edge.x1 - edge.f + 1} y={edge.y0 - 1} width={edge.f} height={edge.y1 - edge.y0 + 2} fill="url(#fade-e)" />
          <rect x={edge.x0 - 1} y={edge.y0 - 1} width={edge.x1 - edge.x0 + 2} height={edge.f} fill="url(#fade-n)" />
        </g>
        {d ? (
          <g style={{ opacity: polityOpacity, transition: "opacity 300ms" }}>
            <path d={d} fill="url(#hatch)" stroke={trackColor} strokeWidth={1.4} strokeLinejoin="round" />
            <path d={d} fill={trackColor} opacity={0.08} />
          </g>
        ) : null}
        <rect width={size.w} height={size.h} fill="url(#vignette)" pointerEvents="none" />
        {thread ? (
          <path d={thread} fill="none" stroke={trackColor} strokeWidth={1.4} strokeDasharray="1.5 5" strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />
        ) : null}
        <g>
          <AnimatePresence>
            {visible.map((e, i) => {
              const [x, y] = projection([e.location.lng, e.location.lat]) ?? [0, 0];
              const active = e.id === activeEventId;
              // Dense chapters: only the active pin and the last few visited keep their labels.
              const labelled = active || i >= visible.length - 4;
              // Wide screens put the active card to the right of a pin left of centre: name that pin on its left.
              const flip = active && size.w >= 1024 && x < size.w / 2;
              const color = e.track === "tradition" ? "var(--tradition)" : "var(--evidence)";
              return (
                <motion.g
                  key={e.id}
                  initial={{ opacity: 0, scale: 0.2, y: -14 }}
                  animate={{ opacity: active ? 1 : 0.75, scale: active ? 1.15 : 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                  style={{ transformOrigin: `${x}px ${y}px`, cursor: "pointer" }}
                  onClick={() => onPick(e)}
                >
                  {active && reduce ? <circle cx={x} cy={y} r={14} fill="none" stroke={color} strokeWidth={1} opacity={0.5} /> : null}
                  {active && !reduce ? (
                    <>
                      <motion.circle
                        cx={x}
                        cy={y}
                        fill="none"
                        stroke={color}
                        strokeWidth={1}
                        initial={{ r: 6, opacity: 0.8 }}
                        animate={{ r: 26, opacity: 0 }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                      />
                      <motion.circle
                        cx={x}
                        cy={y}
                        fill="none"
                        stroke={color}
                        strokeWidth={1}
                        initial={{ r: 6, opacity: 0.8 }}
                        animate={{ r: 26, opacity: 0 }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.9 }}
                      />
                    </>
                  ) : null}
                  <circle cx={x} cy={y} r={16} fill="transparent" />
                  {e.track === "tradition" ? (
                    <rect x={x - 4.5} y={y - 4.5} width={9} height={9} transform={`rotate(45 ${x} ${y})`} fill={color} stroke="var(--paper)" strokeWidth={1.5} />
                  ) : (
                    <circle cx={x} cy={y} r={active ? 6 : 4.5} fill={color} stroke="var(--paper)" strokeWidth={1.5} />
                  )}
                  {labelled ? (
                    <text
                      x={flip ? x - 12 : x + 10}
                      y={y + 4}
                      textAnchor={flip ? "end" : "start"}
                      fontSize={11}
                      fill="var(--ink)"
                      stroke="var(--paper)"
                      strokeWidth={3}
                      paintOrder="stroke"
                      style={{ fontFamily: "var(--font-sans)" }}
                    >
                      {e.location.name.split(",")[0]}
                    </text>
                  ) : null}
                </motion.g>
              );
            })}
          </AnimatePresence>
        </g>
      </svg>
      <AnimatePresence mode="wait">
        {polityLabel ? (
          <motion.div
            key={polityLabel}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="pointer-events-none absolute bottom-28 left-4 max-w-[60%] text-[12px] leading-tight text-ink-2 lg:bottom-24 lg:left-6"
          >
            <span className={lang === "hi" ? "font-hi" : "font-display"} style={{ color: trackColor }}>
              {polityLabel}
            </span>
            {polityMeta?.approximate ? <span className="block text-[11px] text-ink-3">approximate outline</span> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
