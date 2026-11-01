"use client";

import { useEffect, useId, useRef } from "react";
import { glyphByName, EASE, KEYFRAMES, SIZE } from "@/lib/glyphs";
import { revealCss } from "@/lib/scenes";

/**
 * Inline dot-matrix glyph. Fills with currentColor so it tints per track.
 * With `progress`, the lit dots draw in as it goes 0 → 1 instead of all breathing from the start.
 */
export function DotGlyph({ name, size = 56, className = "", progress }: { name: string; size?: number; className?: string; progress?: number }) {
  const g = glyphByName[name] ?? glyphByName.wave;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const p = `g${uid}`;
  const ref = useRef<SVGSVGElement>(null);
  const maxDelay = Math.max(1, ...g.lit.map((d) => d.delay));
  useEffect(() => {
    if (progress === undefined) return;
    ref.current?.style.setProperty("--p", String(Math.max(0, Math.min(1, progress))));
  }, [progress]);
  const css =
    progress === undefined
      ? `.${p}l{fill:currentColor;opacity:0;animation:${p}k ${g.period}ms ${EASE} infinite both;}` +
        `@keyframes ${p}k{${KEYFRAMES}}` +
        `@media (prefers-reduced-motion:reduce){.${p}l{animation:none;opacity:0.45;}}`
      : revealCss(`${p}l`, g.period, KEYFRAMES, EASE);
  return (
    <svg ref={ref} viewBox={`0 0 ${SIZE} ${SIZE}`} width={size} height={size} role="img"
      aria-label={g.title}
      className={className}
      style={progress === undefined ? undefined : ({ "--p": Math.max(0, Math.min(1, progress)) } as React.CSSProperties)}
    >
      <title>{g.title}</title>
      <style>{css}</style>
      {g.base.map((d, i) => (
        <circle key={`b${i}`} cx={d.x} cy={d.y} r={2.4} fill="currentColor" opacity={0.09} />
      ))}
      {g.lit.map((d, i) => (
        <circle
          key={`l${i}`}
          cx={d.x}
          cy={d.y}
          r={3.1}
          className={`${p}l`}
          style={{ "--t": Math.round((d.delay / maxDelay) * 700) / 1000, animationDelay: `${d.delay}ms` } as React.CSSProperties}
        />
      ))}
    </svg>
  );
}
