"use client";

import { type CSSProperties, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { clampUnit, LAND, smooth } from "@/lib/turn";

type Props = {
  /** How far the turn has come, 0 to 1. */
  t: number;
  /** Strips the sheet is cut into. More bend smoothly, fewer cost less. */
  strips: number;
  /** How far round the sheet ends up, in degrees. */
  sweep?: number;
  /** The face of the sheet. Rendered once, out of sight, then copied into each strip. */
  children?: ReactNode;
  /** Or copy an element already on the page, at whatever state it is in now. */
  copy?: HTMLElement | null;
  /** The other side of the sheet. Without one it is blank paper, which fades once the sheet has landed. */
  back?: ReactNode;
  /** The chapter whose paper the blank side uses. */
  folio: string;
  /** Size to the face's own height, for a card rather than a full page. */
  fit?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** The outer edge leads the spine by this share of the turn, which is what bows the sheet. */
const LEAD = 0.42;
/** How dark a strip goes when it stands edge-on to the light. */
const DARKEST = 0.42;

/** A copy of the sheet, cut to one strip's slice of it. */
function copyInto(target: HTMLElement, source: HTMLElement, from: number, width: number) {
  const copy = source.cloneNode(true) as HTMLElement;
  copy.removeAttribute("id");
  target.replaceChildren(copy);
  paintCanvases(copy, source, from, width);
}

/**
 * A copied canvas comes out blank, so its picture is carried over by hand. Each strip keeps only the slice it shows,
 * so a sketch cut into nine strips costs the memory of one picture, not nine.
 */
function paintCanvases(copy: HTMLElement, source: HTMLElement, from: number, width: number) {
  const copies = copy.querySelectorAll("canvas");
  source.querySelectorAll("canvas").forEach((canvas, n) => {
    const target = copies[n];
    if (!target || !canvas.width) return;
    const left = canvas.getBoundingClientRect().left - source.getBoundingClientRect().left;
    const shown = canvas.clientWidth;
    const start = Math.max(from, left);
    const end = Math.min(from + width, left + shown);
    if (end <= start) {
      target.style.display = "none";
      return;
    }
    const scale = canvas.width / shown;
    target.style.width = `${end - start}px`;
    target.style.marginLeft = `${start - left}px`;
    target.width = Math.round((end - start) * scale);
    target.height = canvas.height;
    target.getContext("2d")?.drawImage(canvas, (start - left) * scale, 0, target.width, canvas.height, 0, 0, target.width, canvas.height);
  });
}

/**
 * A sheet of paper turning over, not a board. It is cut into upright strips, and each takes its own angle from a turn
 * that reaches the outer edge first, so the sheet bows as it comes round and the part by the spine settles last. Every
 * strip holds a copy of the face, moved along so that together they read as one page. Each frame only sets transforms
 * and a brightness, so the text is painted once.
 */
export function TurningSheet({ t, strips, sweep = 180, children, copy, back, folio, fit = false, className = "", style }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const master = useRef<HTMLDivElement>(null);
  const reverse = useRef<HTMLDivElement>(null);
  const cast = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const faces = useRef<HTMLElement[]>([]);
  const backs = useRef<HTMLElement[]>([]);
  const cuts = useRef<HTMLElement[]>([]);
  const nearShades = useRef<HTMLElement[]>([]);
  const farShades = useRef<HTMLElement[]>([]);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const width = el.offsetWidth;
    const height = fit ? ((master.current?.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0) : el.offsetHeight;
    setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
  }, [fit]);

  const fill = useCallback(() => {
    const { width } = size;
    if (!width) return;
    const step = width / strips;
    const source = copy ?? (master.current?.firstElementChild as HTMLElement | null);
    const verso = reverse.current?.firstElementChild as HTMLElement | null;
    faces.current.forEach((face, i) => source && copyInto(face, source, i * step, step + 1));
    // The back is read from the other side, so its first strip holds the far end of the page.
    backs.current.forEach((face, i) => verso && copyInto(face, verso, width - (i + 1) * step, step + 1));
  }, [copy, size, strips]);

  useLayoutEffect(fill, [fill]);

  // A sketch on the sheet may finish drawing after it was copied.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.addEventListener("drawn", fill);
    return () => el.removeEventListener("drawn", fill);
  }, [fill]);

  useLayoutEffect(() => {
    const { width } = size;
    if (!width) return;
    const step = width / strips;
    const p = clampUnit(t / LAND);
    const angleAt = (along: number) => sweep * smooth(clampUnit(p * (1 + LEAD) - LEAD * (1 - along)));
    const darkAt = (along: number) => DARKEST * Math.max(0, Math.sin((Math.PI * angleAt(along)) / 180)) ** 1.4;
    let x = 0;
    let z = 0;
    for (let i = 0; i < strips; i++) {
      const cut = cuts.current[i];
      if (!cut) continue;
      const angle = angleAt((i + 0.5) / strips);
      const facing = angle < 90;
      cut.style.transform = `translate3d(${x.toFixed(2)}px,0,${z.toFixed(2)}px) rotateY(${(-angle).toFixed(2)}deg)`;
      // Each strip shades from one neighbour's darkness to the next, so the bend reads as a curve and not as slats.
      const near = nearShades.current[i];
      const far = farShades.current[i];
      if (near) near.style.opacity = darkAt(i / strips).toFixed(3);
      if (far) far.style.opacity = darkAt((i + 1) / strips).toFixed(3);
      const face = faces.current[i];
      const verso = backs.current[i];
      if (face) face.style.visibility = facing ? "visible" : "hidden";
      if (verso) verso.style.visibility = facing ? "hidden" : "visible";
      x += Math.cos((Math.PI * angle) / 180) * step;
      z += Math.sin((Math.PI * angle) / 180) * step;
    }
    const sheet = box.current;
    if (sheet && !back) sheet.style.opacity = t < LAND ? "1" : String(1 - (t - LAND) / (1 - LAND));
    // The shadow lies on whichever page is under the outer edge, and tightens as the sheet comes down.
    const shadow = cast.current;
    if (shadow) {
      shadow.style.opacity = String(Math.min(1, z / (width * 0.4)) * 0.75);
      shadow.style.transform = `scaleX(${x / width + Math.sign(x || 1) * 0.12})`;
    }
  }, [t, size, strips, sweep, back]);

  const { width, height } = size;
  const step = width / strips;
  return (
    <div
      ref={box}
      aria-hidden
      inert
      className={`sheet ${className}`}
      style={{ ...style, height: fit && height ? height : style?.height }}
    >
      <div ref={cast} className="sheet-cast" />
      <div ref={master} className="sheet-master">
        {children}
      </div>
      {back ? (
        <div ref={reverse} className="sheet-master">
          {back}
        </div>
      ) : null}
      {width
        ? Array.from({ length: strips }, (_, i) => (
            <div
              key={i}
              ref={(el) => {
                if (el) cuts.current[i] = el;
              }}
              className="sheet-cut"
              // A hair of overlap, so no seam shows between strips.
              style={{ width: step + 1 }}
            >
              <div
                ref={(el) => {
                  if (el) faces.current[i] = el;
                }}
                className="sheet-side"
                style={{ width, transform: `translateX(${-i * step}px)` }}
              />
              {/* Seen from behind, a strip reads backwards, so the back is mirrored to read true. */}
              <div
                ref={(el) => {
                  if (el) backs.current[i] = el;
                }}
                className="sheet-side page"
                data-folio={folio}
                style={{ width, transformOrigin: "0 50%", transform: `translateX(${width - i * step}px) scaleX(-1)` }}
              />
              <div
                ref={(el) => {
                  if (el) nearShades.current[i] = el;
                }}
                className="sheet-shade"
              />
              <div
                ref={(el) => {
                  if (el) farShades.current[i] = el;
                }}
                className="sheet-shade sheet-shade-far"
              />
            </div>
          ))
        : null}
    </div>
  );
}
