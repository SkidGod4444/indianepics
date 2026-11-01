"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

export type Plate = { id: string; src: string; title: string; credit: string; accent: string };

type Props = { plates: Plate[]; active: number; className?: string };

/** Dots across the plate's width. Height follows the plate's own ratio (4:5). */
const COLS = 84;
const RATIO = 5 / 4;
const ROWS = Math.round(COLS * RATIO);
const FADE_MS = 1100;

/**
 * A picture told in dots: the image is cover-cropped onto a 4:5 plate, sampled to a grid, and every cell
 * becomes a circle whose size is the darkness there, in the chapter's accent on the paper. Switching
 * plates grows and shrinks the dots in a sweep from the left, so one era dissolves into the next.
 */
export function DotPlate({ plates, active, className }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const cache = useRef(new Map<string, Promise<Float32Array>>());
  const shown = useRef<Float32Array | null>(null);
  const accent = useRef<string>("");

  // Sample one image to a grid of darkness values (0 light … 1 dark), cover-cropped to the plate.
  const sample = (src: string) => {
    const c = cache.current;
    let p = c.get(src);
    if (!p) {
      p = new Promise<Float32Array>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          const off = document.createElement("canvas");
          off.width = COLS;
          off.height = ROWS;
          const ctx = off.getContext("2d", { willReadFrequently: true })!;
          const s = Math.max(COLS / img.naturalWidth, ROWS / img.naturalHeight);
          const w = img.naturalWidth * s;
          const h = img.naturalHeight * s;
          ctx.drawImage(img, (COLS - w) / 2, (ROWS - h) / 2, w, h);
          const d = ctx.getImageData(0, 0, COLS, ROWS).data;
          const out = new Float32Array(COLS * ROWS);
          let lo = 1;
          let hi = 0;
          for (let i = 0; i < out.length; i++) {
            const l = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
            out[i] = 1 - l;
            if (out[i] < lo) lo = out[i];
            if (out[i] > hi) hi = out[i];
          }
          // Stretch the contrast so a pale photograph still makes a drawing.
          const span = Math.max(0.2, hi - lo);
          for (let i = 0; i < out.length; i++) out[i] = Math.pow((out[i] - lo) / span, 1.1);
          resolve(out);
        };
        img.onerror = () => resolve(new Float32Array(COLS * ROWS));
        img.src = src;
      });
      c.set(src, p);
    }
    return p;
  };

  useEffect(() => {
    const el = canvas.current;
    const plate = plates[active];
    if (!el || !plate) return;
    let raf = 0;
    let cancelled = false;
    const draw = (vals: Float32Array, color: string) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = el.clientWidth;
      const h = w * RATIO;
      if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
      }
      const ctx = el.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cell = w / COLS;
      const rMax = cell * 0.58;
      // Four inks, light to dark: the accent thinned, the accent, the accent deepened, and near-ink for the shadows.
      const ink = getComputedStyle(el).getPropertyValue("--ink").trim() || "#1c1915";
      const passes: { lo: number; hi: number; style: string; alpha: number }[] = [
        { lo: 0.12, hi: 0.38, style: color, alpha: 0.55 },
        { lo: 0.38, hi: 0.62, style: color, alpha: 0.9 },
        { lo: 0.62, hi: 0.82, style: `color-mix(in srgb, ${color} 60%, ${ink})`, alpha: 1 },
        { lo: 0.82, hi: 1.01, style: ink, alpha: 0.92 },
      ];
      for (const pass of passes) {
        ctx.fillStyle = pass.style;
        ctx.globalAlpha = pass.alpha;
        ctx.beginPath();
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const v = vals[r * COLS + c];
            if (v < pass.lo || v >= pass.hi) continue;
            const rad = rMax * (0.18 + 0.82 * v);
            ctx.moveTo(c * cell + cell / 2 + rad, r * cell + cell / 2);
            ctx.arc(c * cell + cell / 2, r * cell + cell / 2, rad, 0, Math.PI * 2);
          }
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    sample(plate.src).then((target) => {
      if (cancelled) return;
      const from = shown.current ?? new Float32Array(COLS * ROWS);
      const fromColor = accent.current || plate.accent;
      accent.current = plate.accent;
      if (reduce || !shown.current) {
        shown.current = target;
        draw(target, plate.accent);
        return;
      }
      const start = performance.now();
      const cur = new Float32Array(COLS * ROWS);
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / FADE_MS);
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            // A sweep: each column's blend lags the one before it, so the change rolls across the plate.
            const k = Math.min(1, Math.max(0, (t * 1.6 - (c / COLS) * 0.6) / 1));
            const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
            const i = r * COLS + c;
            cur[i] = from[i] + (target[i] - from[i]) * e;
          }
        }
        draw(cur, t < 0.5 ? fromColor : plate.accent);
        if (t < 1) raf = requestAnimationFrame(tick);
        else shown.current = target;
      };
      raf = requestAnimationFrame(tick);
    });
    const onResize = () => shown.current && draw(shown.current, accent.current || plate.accent);
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, plates, reduce]);

  // Warm the other plates in the background so the first switch is instant.
  useEffect(() => {
    const id = window.setTimeout(() => plates.forEach((p) => void sample(p.src)), 1200);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plates]);

  return <canvas ref={canvas} className={className} style={{ aspectRatio: `${1 / RATIO}` }} aria-hidden />;
}
