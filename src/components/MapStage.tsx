"use client";

import { memo, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { interpolate } from "flubber";
import { geoMercator, type GeoProjection } from "d3-geo";
import type { BookChapter, BookEvent, Polity } from "@/content/schema";
import { countries, FRAME, pathFor, ringToFeature } from "@/lib/geo";
import { BOTTOM_NARROW } from "./EventCallout";
import type { Position } from "@/lib/timeline";
import { pick } from "@/lib/text";
import { useLang } from "@/lib/i18n";

type Props = {
  size: { w: number; h: number };
  chapters: BookChapter[];
  polities: Polity[];
  /** Events of the current chapter that have been revealed, in order. */
  visible: BookEvent[];
  pos: Position;
  /** Progress through the current slot; the thread catches up to the active pin over it. */
  /** How far the current page has turned: the thread reaches the new pin as the page lands. */
  turn: number;
  /** How far the old borders have moved to this chapter's, 0 to 1. */
  shift: number;
  activeEventId: string | null;
  onPick: (ev: BookEvent) => void;
};

/** Polities before this year get a soft edge. */
const SOFT_BEFORE = 1800;

/** The water and land: the same every frame, on their own layer, so scrolling never repaints them. */
const Base = memo(function Base({ w, h, paths, edge }: { w: number; h: number; paths: { name: string; d: string }[]; edge: { x0: number; y0: number; x1: number; y1: number; f: number } }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="map-layer">
      <defs>
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
      </defs>
      <rect width={w} height={h} fill="var(--water)" className="era-fill" />
      <g>
        {paths.map((c) => (
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
    </svg>
  );
});

/** The state's shape. Its own layer, repainted only while one border morphs into the next. */
const Realm = memo(function Realm({ w, h, d, soft, color, opacity }: { w: number; h: number; d?: string; soft: boolean; color: string; opacity: number }) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="map-layer pointer-events-none">
      <defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke={color} strokeWidth="0.8" opacity="0.35" />
        </pattern>
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="var(--paper)" stopOpacity="0" className="era-stop" />
          <stop offset="100%" stopColor="var(--paper)" stopOpacity="0.9" className="era-stop" />
        </radialGradient>
      </defs>
      {d ? (
        <g style={{ opacity, transition: "opacity 300ms" }}>
          {/* Before about 1800 a state's edge was a zone of influence, not a line. Wide faint strokes draw that without a blur filter. */}
          {soft ? <path d={d} fill="none" stroke={color} strokeWidth={16} strokeLinejoin="round" opacity={0.07} /> : null}
          {soft ? <path d={d} fill="none" stroke={color} strokeWidth={8} strokeLinejoin="round" opacity={0.09} /> : null}
          <path d={d} fill="url(#hatch)" stroke={color} strokeWidth={soft ? 1 : 1.4} strokeDasharray={soft ? "2 5" : undefined} strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill={color} opacity={0.08} />
        </g>
      ) : null}
      <rect width={w} height={h} fill="url(#vignette)" />
    </svg>
  );
});

type PinsProps = { visible: BookEvent[]; projection: GeoProjection; activeEventId: string | null; wide: boolean; spine: number; onPick: (ev: BookEvent) => void };

/** The pins. They change when a pin arrives or the active one changes, never on a plain scroll frame. */
const Pins = memo(
  function Pins({ visible, projection, activeEventId, wide, spine, onPick }: PinsProps) {
    const reduce = useReducedMotion();
    return (
      <g>
        <AnimatePresence>
          {visible.map((e, i) => {
            const [x, y] = projection([e.location.lng, e.location.lat]) ?? [0, 0];
            const active = e.id === activeEventId;
            // Dense chapters: only the active pin and the last few visited keep their labels.
            const labelled = active || i >= visible.length - 4;
            // Near the spine a pin's name would run under the right page: put it on the left.
            const flip = wide && x > spine * 0.72;
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
    );
  },
  (a, b) =>
    a.activeEventId === b.activeEventId &&
    a.projection === b.projection &&
    a.wide === b.wide &&
    a.spine === b.spine &&
    a.onPick === b.onPick &&
    a.visible.length === b.visible.length &&
    a.visible.every((e, i) => e === b.visible[i]),
);

export function MapStage({ size, chapters, polities, visible, pos, turn, shift, activeEventId, onPick }: Props) {
  const { lang } = useLang();
  // Viewport to projection. The map is the stage; everything else is placed on it.
  const projection = useMemo(() => {
    const narrow = size.w < 1024;
    // Fit the subcontinent into the part of the screen the chrome leaves free: on a wide screen the left page, under the
    // header and above the scrubber; on a phone above the bottom card (a tall card is ~250px), so southern pins stay clear.
    const pad = narrow ? 20 : Math.max(32, size.w * 0.04);
    const extent: [[number, number], [number, number]] = narrow
      ? [
          [pad, 72],
          [size.w - pad, Math.max(size.h * 0.5, size.h - BOTTOM_NARROW - 250)],
        ]
      : [
          [pad, 84],
          [size.w / 2 - pad, size.h - 120],
        ];
    return geoMercator().fitExtent(extent, FRAME);
  }, [size]);
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

  const ch = chapters[pos.chapter];
  const prev = chapters[pos.chapter - 1];
  const curPolity = ch?.polity ? polityPath.get(ch.polity) : undefined;
  const prevPolity = prev?.polity ? polityPath.get(prev.polity) : undefined;
  // Built when the chapter arrives, not all at once on load.
  const morph = useMemo(
    () => (prevPolity && curPolity ? interpolate(prevPolity, curPolity, { maxSegmentLength: 10 }) : undefined),
    [prevPolity, curPolity],
  );
  const t = shift;
  const d = morph && t < 1 ? morph(t) : curPolity;
  const polityOpacity = curPolity ? (prev?.polity ? 1 : Math.min(1, shift * 2)) : 0;
  const polityMeta = ch?.polity ? polities.find((p) => p.id === ch.polity) : undefined;
  const polityLabel = polityMeta && t >= 1 ? pick(polityMeta, "name", lang) : "";
  const trackColor = ch?.track === "tradition" ? "var(--tradition)" : "var(--evidence)";
  const soft = polityMeta ? polityMeta.year < SOFT_BEFORE : false;

  // The story thread: a dotted route through the pins in order, reaching the active one as its page lands.
  const thread = useMemo(() => {
    const pts = visible.map((e) => projection([e.location.lng, e.location.lat]) ?? [0, 0]);
    if (pts.length < 2) return "";
    const e = 1 - Math.pow(1 - turn, 3);
    const [ax, ay] = pts[pts.length - 2];
    const [bx, by] = pts[pts.length - 1];
    const head = [ax + (bx - ax) * e, ay + (by - ay) * e];
    return [...pts.slice(0, -1), head].map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  }, [visible, projection, turn]);

  // On a wide screen the event's text is across the spine: a dotted line ties its pin to the page.
  const pin = size.w >= 1024 ? visible.find((e) => e.id === activeEventId) : undefined;
  const at = pin ? projection([pin.location.lng, pin.location.lat]) : null;
  const leader = at ? { x1: at[0], y1: at[1], x2: size.w / 2, y2: at[1] } : null;

  return (
    <div className="relative h-full w-full">
      <Base w={size.w} h={size.h} paths={countryPaths} edge={edge} />
      <Realm w={size.w} h={size.h} d={d} soft={soft} color={trackColor} opacity={polityOpacity} />
      <svg viewBox={`0 0 ${size.w} ${size.h}`} width={size.w} height={size.h} className="map-layer">
        {leader ? <line {...leader} stroke={trackColor} strokeWidth={1} strokeDasharray="1.5 5" strokeLinecap="round" opacity={0.6} /> : null}
        {thread ? (
          <path d={thread} fill="none" stroke={trackColor} strokeWidth={1.4} strokeDasharray="1.5 5" strokeLinecap="round" strokeLinejoin="round" opacity={0.75} />
        ) : null}
        <Pins visible={visible} projection={projection} activeEventId={activeEventId} wide={size.w >= 1024} spine={size.w / 2} onPick={onPick} />
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
