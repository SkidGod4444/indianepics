"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

type Stroke = { weight: number; points: number[] };
type Drawing = { width: number; height: number; strokes: Stroke[]; total: number };

/** Pen widths for the three stroke weights, in drawing pixels. */
const PEN = [0, 1.5, 2.2, 3.4];
const MAX_DPR = 2;

function parse(text: string): Drawing {
  const [size, ...rows] = text.split("\n");
  const [width, height] = size.split(" ").map(Number);
  let total = 0;
  const strokes = rows.map((row) => {
    const n = row.split(" ").map(Number);
    let [, x, y] = n;
    const points = [x, y];
    for (let i = 3; i < n.length; i += 2) {
      x += n[i];
      y += n[i + 1];
      points.push(x, y);
      total += Math.hypot(n[i], n[i + 1]);
    }
    return { weight: n[0], points };
  });
  return { width, height, strokes, total };
}

const drawings = new Map<string, Promise<Drawing>>();

/** Fetches a sketch once. Safe to call ahead of time, so the next one is ready when it is needed. */
export function loadSketch(id: string) {
  let job = drawings.get(id);
  if (!job) {
    job = fetch(`/sketch/${id}.txt`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(id))))
      .then(parse);
    job.catch(() => drawings.delete(id));
    drawings.set(id, job);
  }
  return job;
}

type Props = {
  id: string;
  /** How long the whole drawing takes on its own. */
  durationMs?: number;
  /** When given and not null, how much of the drawing should be on the page: the story's clock, not this sketch's own. */
  pen?: () => number | null;
  className?: string;
};

/**
 * A sketch that draws itself, one pen stroke at a time. Only the new part of the line is painted each frame, so it
 * costs a phone next to nothing, and the file is a few dozen KB of strokes rather than a picture.
 */
export function Sketch({ id, durationMs = 6500, pen, className = "" }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const pace = useRef(durationMs);
  const penRef = useRef(pen);
  useEffect(() => {
    pace.current = durationMs;
    penRef.current = pen;
  }, [durationMs, pen]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    let alive = true;
    let raf = 0;
    let drawing: Drawing | null = null;
    let scale = 1;
    // Share of the drawing on the page, kept so a resize can put it back.
    let shown = 0;
    // How far the pen has got: stroke, segment within it, and length so far.
    let stroke = 0;
    let segment = 0;
    let length = 0;

    const restart = () => {
      if (!drawing) return;
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      // The layout size: a page caught mid-turn reports a squashed rect, which would smear the drawing across the canvas.
      const width = el.clientWidth;
      const height = el.clientHeight;
      el.width = Math.max(1, Math.round(width * dpr));
      el.height = Math.max(1, Math.round(height * dpr));
      scale = Math.min(width / drawing.width, height / drawing.height);
      const x = (width - drawing.width * scale) / 2;
      const y = (height - drawing.height * scale) / 2;
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, x * dpr, y * dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = getComputedStyle(el).color;
      stroke = 0;
      segment = 0;
      length = 0;
    };

    /** Lays down the line up to a length, starting from where the pen stopped. */
    const drawTo = (target: number) => {
      if (!drawing) return;
      while (length < target && stroke < drawing.strokes.length) {
        const { weight, points: p } = drawing.strokes[stroke];
        const last = p.length / 2 - 2;
        ctx.lineWidth = Math.max(0.9 / scale, PEN[weight]);
        ctx.beginPath();
        while (segment <= last && length < target) {
          const k = segment * 2;
          // A curve through the middles of the segments, so the line has no corners.
          const startX = segment ? (p[k - 2] + p[k]) / 2 : p[k];
          const startY = segment ? (p[k - 1] + p[k + 1]) / 2 : p[k + 1];
          const endX = segment < last ? (p[k] + p[k + 2]) / 2 : p[k + 2];
          const endY = segment < last ? (p[k + 1] + p[k + 3]) / 2 : p[k + 3];
          ctx.moveTo(startX, startY);
          if (segment) ctx.quadraticCurveTo(p[k], p[k + 1], endX, endY);
          else ctx.lineTo(endX, endY);
          length += Math.hypot(p[k + 2] - p[k], p[k + 3] - p[k + 1]);
          segment++;
        }
        ctx.stroke();
        if (segment > last) {
          stroke++;
          segment = 0;
        }
      }
    };

    const start = () => {
      let began = performance.now();
      const frame = (now: number) => {
        if (!alive || !drawing) return;
        const told = penRef.current?.() ?? null;
        if (told === null) shown = pace.current > 0 ? Math.min(1, (now - began) / pace.current) : 1;
        else {
          // Ink stays on the page: a pen that is ahead of the clock waits for it.
          shown = Math.max(shown, told);
          began = now - shown * pace.current;
        }
        drawTo(drawing.total * shown);
        if (shown < 1) raf = requestAnimationFrame(frame);
        else el.dispatchEvent(new Event("drawn", { bubbles: true }));
      };
      raf = requestAnimationFrame(frame);
    };

    const observer = new ResizeObserver(() => {
      restart();
      if (drawing) drawTo(drawing.total * shown);
    });
    loadSketch(id)
      .then((d) => {
        if (!alive) return;
        drawing = d;
        restart();
        if (reduce || pace.current <= 0) {
          shown = 1;
          drawTo(d.total);
          el.dispatchEvent(new Event("drawn", { bubbles: true }));
        } else start();
        observer.observe(el);
      })
      .catch(() => {});
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [id, reduce]);

  return <canvas ref={canvas} aria-hidden className={`block h-full w-full text-ink ${className}`} />;
}
