"use client";

import { useId, useMemo } from "react";
import { geoContains, geoMercator } from "d3-geo";
import { countries, FRAME } from "@/lib/geo";
import { EASE } from "@/lib/glyphs";
import { SCENE_KEYFRAMES } from "@/lib/scenes";

const W = 480;
const H = 540;
const STEP = 11;

/**
 * The subcontinent as a dot matrix, sampled from the real Natural Earth geometry:
 * India lit and breathing in a wave, neighbours as the faint base grid.
 */
export function DotIndia({ className = "" }: { className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `i${uid}`;
  const { lit, base } = useMemo(() => {
    const proj = geoMercator().fitExtent(
      [
        [8, 8],
        [W - 8, H - 8],
      ],
      FRAME,
    );
    const india = countries.features.find((f) => f.properties.name === "India");
    const others = countries.features.filter((f) => f !== india);
    const lit: { x: number; y: number; delay: number }[] = [];
    const base: { x: number; y: number }[] = [];
    for (let y = STEP / 2, r = 0; y < H; y += STEP, r++) {
      for (let x = STEP / 2, c = 0; x < W; x += STEP, c++) {
        const ll = proj.invert?.([x, y]);
        if (!ll) continue;
        if (india && geoContains(india, ll)) lit.push({ x, y, delay: c * 110 + r * 26 });
        else if (others.some((f) => geoContains(f, ll))) base.push({ x, y });
      }
    }
    return { lit, base };
  }, []);
  const css =
    `.${cls}{fill:currentColor;animation:${cls}k 4200ms ${EASE} infinite both;}` +
    `@keyframes ${cls}k{${SCENE_KEYFRAMES}}` +
    `@media (prefers-reduced-motion:reduce){.${cls}{animation:none;opacity:0.85;}}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="The subcontinent, drawn in dots" className={className}>
      <title>The subcontinent, drawn in dots</title>
      <style>{css}</style>
      {base.map((d, i) => (
        <circle key={`b${i}`} cx={d.x} cy={d.y} r={1.6} fill="currentColor" opacity={0.1} />
      ))}
      {lit.map((d, i) => (
        <circle key={`l${i}`} cx={d.x} cy={d.y} r={3.6} className={cls} style={{ animationDelay: `${d.delay}ms` }} />
      ))}
    </svg>
  );
}
