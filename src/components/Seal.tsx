"use client";

import { useId } from "react";
import { DotGlyph } from "./DotGlyph";

/**
 * The colophon: our name and address set on a slowly turning ring around the chakra glyph.
 * A stamp, the way a press marks a plate. Still under reduced motion.
 */
export function Seal({ size = 92, className = "" }: { size?: number; className?: string }) {
  const id = useId();
  const r = 36;
  return (
    <div className={`relative inline-grid place-items-center ${className}`} style={{ width: size, height: size }} aria-label="indianepics.online">
      <svg viewBox="0 0 100 100" width={size} height={size} className="seal-ring absolute inset-0 text-ink-2" aria-hidden>
        <defs>
          <path id={`${id}-c`} d={`M50,50 m-${r},0 a${r},${r} 0 1,1 ${2 * r},0 a${r},${r} 0 1,1 -${2 * r},0`} />
        </defs>
        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.8" />
        <circle cx="50" cy="50" r="24" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="0.6" />
        <text fill="currentColor" fontSize="9.2" letterSpacing="1.9" style={{ fontFamily: "var(--font-sans)", fontWeight: 500 }}>
          <textPath href={`#${id}-c`} startOffset="0">
            INDIANEPICS.ONLINE · सत्य युग से आज तक · INDIANEPICS.ONLINE · सत्य युग से आज तक ·
          </textPath>
        </text>
      </svg>
      <DotGlyph name="chakra" size={Math.round(size * 0.3)} className="text-evidence" />
    </div>
  );
}
