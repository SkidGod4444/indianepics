"use client";

import { useEffect, useId, useRef } from "react";
import { EASE } from "@/lib/glyphs";
import { SCENES, SCENE_H, SCENE_KEYFRAMES, SCENE_W, revealCss } from "@/lib/scenes";

/**
 * A dot-matrix scene that draws itself as `progress` goes 0 → 1, then keeps breathing.
 * Fills with currentColor. Progress is written as a CSS variable, so scrolling never re-renders dots.
 */
export function DotScene({ name, progress = 1, className = "", style }: { name: string; progress?: number; className?: string; style?: React.CSSProperties }) {
  const sc = SCENES[name] ?? SCENES.pillar;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const cls = `s${uid}`;
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    ref.current?.style.setProperty("--p", String(Math.max(0, Math.min(1, progress))));
  }, [progress]);
  return (
    <svg ref={ref} viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} role="img" aria-label={sc.title} className={className} style={style}>
      <title>{sc.title}</title>
      <style>{revealCss(cls, sc.period, SCENE_KEYFRAMES, EASE)}</style>
      {sc.base.map((d, i) => (
        <circle key={`b${i}`} cx={d.x} cy={d.y} r={1.5} fill="currentColor" opacity={0.05} />
      ))}
      {sc.lit.map((d, i) => (
        <circle key={`l${i}`} cx={d.x} cy={d.y} r={4} className={cls} style={{ "--t": d.t, animationDelay: `${d.delay}ms` } as React.CSSProperties} />
      ))}
    </svg>
  );
}
