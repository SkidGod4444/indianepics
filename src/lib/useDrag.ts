"use client";

import { type KeyboardEvent, type RefObject, useCallback, useEffect, useRef } from "react";

/** A press only becomes a drag past this distance, so a tap on a button is still a tap. */
const DRAG_PX = 6;
/** How close to the edge of the screen the element may go. */
const EDGE_PX = 8;
const KEY_STEP_PX = 24;

const clamp = (n: number, low: number, high: number) => Math.min(Math.max(n, low), high);

function read(key: string) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "null");
    return typeof saved?.x === "number" && typeof saved?.y === "number" ? { x: saved.x as number, y: saved.y as number } : null;
  } catch {
    return null;
  }
}

function write(key: string, at: { x: number; y: number }) {
  try {
    localStorage.setItem(key, JSON.stringify(at));
  } catch {
    // A private window: it is simply not remembered.
  }
}

/**
 * Lets an element be picked up and put down anywhere on the screen, by mouse, finger or arrow keys, and remembers where.
 * It moves by transform from where the page placed it, and is kept on screen when the window changes size.
 * Returns the key handler for a grip button, which is how a keyboard moves it.
 */
export function useDrag(ref: RefObject<HTMLElement | null>, storageKey: string) {
  const at = useRef({ x: 0, y: 0 });

  const place = useCallback(
    (x: number, y: number) => {
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      const left = box.left - at.current.x;
      const top = box.top - at.current.y;
      at.current = {
        x: clamp(x, EDGE_PX - left, window.innerWidth - EDGE_PX - box.width - left),
        y: clamp(y, EDGE_PX - top, window.innerHeight - EDGE_PX - box.height - top),
      };
      el.style.transform = `translate3d(${at.current.x}px,${at.current.y}px,0)`;
    },
    [ref],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const saved = read(storageKey);
    if (saved) place(saved.x, saved.y);

    const onResize = () => place(at.current.x, at.current.y);
    const onDown = (press: PointerEvent) => {
      if (press.button !== 0) return;
      const from = { ...at.current };
      let moving = false;
      const onMove = (e: PointerEvent) => {
        if (e.pointerId !== press.pointerId) return;
        const dx = e.clientX - press.clientX;
        const dy = e.clientY - press.clientY;
        if (!moving && Math.hypot(dx, dy) < DRAG_PX) return;
        moving = true;
        el.dataset.dragging = "";
        place(from.x + dx, from.y + dy);
      };
      const onUp = (e: PointerEvent) => {
        if (e.pointerId !== press.pointerId) return;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        if (!moving) return;
        delete el.dataset.dragging;
        write(storageKey, at.current);
        // The press may have ended on a button: the click that follows was a drag, not a click.
        const swallow = (click: MouseEvent) => {
          click.stopPropagation();
          click.preventDefault();
        };
        el.addEventListener("click", swallow, { capture: true, once: true });
        window.setTimeout(() => el.removeEventListener("click", swallow, { capture: true }), 0);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onResize);
    };
  }, [ref, storageKey, place]);

  return useCallback(
    (e: KeyboardEvent) => {
      const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!step) return;
      // Left and right turn the page everywhere else.
      e.preventDefault();
      e.stopPropagation();
      place(at.current.x + step[0] * KEY_STEP_PX, at.current.y + step[1] * KEY_STEP_PX);
      write(storageKey, at.current);
    },
    [place, storageKey],
  );
}
