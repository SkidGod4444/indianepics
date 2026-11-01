"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig } from "motion/react";
import type { Chapter, EpicEvent, Polity, Track } from "@/content/schema";
import { useLang } from "@/lib/i18n";
import { pick } from "@/lib/text";
import { geoMercator } from "d3-geo";
import { FRAME } from "@/lib/geo";
import { activeIndexAt, clamp01, readoutAt, slotAt, type Position } from "@/lib/timeline";
import { BASE_ERA, applyEra, eraFor } from "@/lib/eras";
import { MapStage } from "./MapStage";
import { Scrubber } from "./Scrubber";
import { ChapterTitle } from "./ChapterTitle";
import { BOTTOM_NARROW, EventCallout } from "./EventCallout";
import { DetailOverlay } from "./DetailOverlay";
import { Intro } from "./Intro";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";

type Props = { chapters: Chapter[]; events: EpicEvent[]; polities: Polity[] };
type TrackFilter = "both" | Track;

/** The point in the viewport that "is now". */
const ANCHOR = 0.5;
/** Scroll length of one slot (a chapter title or one event), in vh. One number to tune the pacing. */
const SLOT_VH = 80;
/** Autoplay: milliseconds to scroll through one slot. */
const PLAY_MS = 5200;

export function Stage({ chapters: allChapters, events, polities }: Props) {
  const { lang } = useLang();
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("both");
  const [pos, setPos] = useState<Position>({ chapter: 0, progress: 0 });
  const [inStory, setInStory] = useState(false);
  const [open, setOpen] = useState<EpicEvent | null>(null);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const [playing, setPlaying] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const pushedRef = useRef(false);

  const chapters = useMemo(
    () => allChapters.filter((c) => trackFilter === "both" || c.track === trackFilter),
    [allChapters, trackFilter],
  );
  const eventsByChapter = useMemo(() => {
    const m: Record<string, EpicEvent[]> = {};
    for (const e of events) {
      if (trackFilter !== "both" && e.track !== trackFilter) continue;
      (m[e.chapter] ??= []).push(e);
    }
    return m;
  }, [events, trackFilter]);

  // Viewport → projection. The map is the stage; everything else is placed on it.
  useEffect(() => {
    const measure = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const projection = useMemo(() => {
    const narrow = viewport.w < 1024;
    // Fit the subcontinent into the part of the screen the chrome leaves free:
    // under the header and readout, above the scrubber, and above the bottom card on phones
    // (a tall card is ~250px), so southern pins are never hidden behind it.
    const pad = narrow ? 20 : Math.max(48, viewport.w * 0.1);
    const extent: [[number, number], [number, number]] = narrow
      ? [
          [pad, 72],
          [viewport.w - pad, Math.max(viewport.h * 0.5, viewport.h - BOTTOM_NARROW - 250)],
        ]
      : [
          [pad, 84],
          [viewport.w - pad, viewport.h - 120],
        ];
    return geoMercator().fitExtent(extent, FRAME);
  }, [viewport]);

  // Scroll → position, measured from the invisible spacer sections.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const anchor = window.innerHeight * ANCHOR;
      const els = sectionRefs.current.filter(Boolean) as HTMLElement[];
      if (!els.length) return;
      // In the story between the first spacer's top and the last spacer's bottom; the hero before it and the index after it are plain pages.
      const first = els[0].getBoundingClientRect();
      const last = els[els.length - 1].getBoundingClientRect();
      setInStory(first.top < window.innerHeight * 0.55 && last.bottom > window.innerHeight * 0.55);
      let next: Position = { chapter: 0, progress: 0 };
      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect();
        if (anchor < r.top) break;
        next = { chapter: i, progress: clamp01((anchor - r.top) / r.height) };
      }
      setPos((p) => (p.chapter === next.chapter && Math.abs(p.progress - next.progress) < 0.0015 ? p : next));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [chapters.length]);

  const seek = useCallback((p: Position, smooth = false) => {
    const el = sectionRefs.current[p.chapter];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const top = window.scrollY + r.top + clamp01(p.progress) * r.height - window.innerHeight * ANCHOR + 1;
    window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Autoplay: a steady scroll, one slot per PLAY_MS. Any wheel, touch or key from the reader pauses it.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let carry = 0;
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const speed = (window.innerHeight * SLOT_VH) / 100 / PLAY_MS;
      carry += speed * dt;
      const dy = Math.floor(carry);
      carry -= dy;
      if (dy) window.scrollBy(0, dy);
      // Stop where the story ends, before the index: the last spacer's bottom passing the anchor.
      const lastEl = sectionRefs.current[sectionRefs.current.length - 1];
      const end =
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2 ||
        (lastEl ? lastEl.getBoundingClientRect().bottom <= window.innerHeight * ANCHOR + 2 : false);
      if (end) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const pause = () => setPlaying(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " ") pause();
    };
    window.addEventListener("wheel", pause, { passive: true });
    window.addEventListener("touchstart", pause, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", pause);
      window.removeEventListener("touchstart", pause);
      window.removeEventListener("keydown", onKey);
    };
  }, [playing]);

  // Space toggles play when nothing else has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " && (e.target === document.body || e.target === document.documentElement)) {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // In-page detail: pushState so the URL is shareable and Back closes it. No navigation.
  const openEvent = useCallback((ev: EpicEvent) => {
    setPlaying(false);
    setOpen(ev);
    // One history entry per open, even if a click and a key both fire: Back must always land on the map.
    if (pushedRef.current) window.history.replaceState({ event: ev.id }, "", `/event/${ev.id}/`);
    else window.history.pushState({ event: ev.id }, "", `/event/${ev.id}/`);
    pushedRef.current = true;
  }, []);
  const closeEvent = useCallback(() => {
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
    } else {
      setOpen(null);
    }
  }, []);
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const id = (e.state as { event?: string } | null)?.event;
      setOpen(id ? events.find((x) => x.id === id) ?? null : null);
      pushedRef.current = !!id;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [events]);

  const ch = chapters[pos.chapter];
  const chEvents = ch ? eventsByChapter[ch.id] ?? [] : [];

  // The room changes with the chapter: palette, texture and type follow the era.
  const eraId = inStory && ch ? ch.id : null;
  useEffect(() => {
    applyEra(eraId ? eraFor(allChapters.find((c) => c.id === eraId)) : BASE_ERA);
  }, [eraId, allChapters]);
  const { slot, frac } = slotAt(pos.progress, chEvents.length);
  const activeIdx = activeIndexAt(pos.progress, chEvents.length);
  const active = activeIdx >= 0 ? chEvents[activeIdx] : null;
  const visible = chEvents.slice(0, Math.max(0, activeIdx + 1));
  const showTitle = inStory && slot === 0;

  const togglePlay = () => {
    if (!playing && !inStory) seek({ chapter: 0, progress: 0 });
    setPlaying(!playing);
  };
  /** Jump to the middle of the previous/next slot, across chapter boundaries. */
  const skip = (dir: 1 | -1) => {
    setPlaying(false);
    const slotsOf = (c: number) => (eventsByChapter[chapters[c]?.id]?.length ?? 0) + 1;
    let c = inStory ? pos.chapter : -1;
    let s = inStory ? slot + dir : 0;
    if (c < 0) c = 0;
    else if (s >= slotsOf(c)) {
      c += 1;
      s = 0;
    } else if (s < 0) {
      c -= 1;
      s = c >= 0 ? slotsOf(c) - 1 : 0;
    }
    if (c < 0 || c >= chapters.length) return;
    seek({ chapter: c, progress: (s + 0.5) / slotsOf(c) }, true);
  };
  const pin: [number, number] = active ? (projection([active.location.lng, active.location.lat]) as [number, number]) : [0, 0];

  return (
    // Reduced motion: motion skips transform and layout animations (the CSS rule in globals.css covers the rest).
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        {/* The stage: a centred map that stays put while the page scrolls underneath. */}
        <div
          className={`fixed inset-0 z-0 transition-opacity duration-700 ${inStory ? "opacity-100" : "opacity-0"}`}
          aria-hidden={!inStory}
        >
          <div className="grain era-pattern relative h-full w-full">
            <MapStage
              size={viewport}
              projection={projection}
              chapters={chapters}
              polities={polities}
              visible={visible}
              pos={pos}
              frac={frac}
              activeEventId={active?.id ?? null}
              onPick={openEvent}
            />
          </div>
        </div>

        {/* Chrome over the stage. Inert on the hero, so the hidden scrubber never swallows clicks on the chapter chips. */}
        <div
          inert={!inStory}
          className={`pointer-events-none fixed inset-0 z-10 transition-opacity duration-500 ${inStory ? "opacity-100" : "opacity-0"}`}
        >
          {/* Reading progress: a hairline along the top edge. */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-hair/60">
            <div
              className={`h-full transition-[width] duration-150 ${ch?.track === "tradition" ? "bg-tradition" : "bg-evidence"}`}
              style={{ width: `${((pos.chapter + clamp01(pos.progress)) / Math.max(1, chapters.length)) * 100}%` }}
            />
          </div>
          <div className="pointer-events-auto absolute right-4 top-14 text-right lg:right-6 lg:top-16">
            <div className="font-display text-[clamp(2rem,5vw,4rem)] leading-none text-ink tabular-nums [text-shadow:0_0_18px_var(--paper)]">
              {ch ? readoutAt(ch, chEvents, pos.progress) : ""}
            </div>
            {ch ? (
              <div className={`mt-1 text-[12px] text-ink-2 [text-shadow:0_0_6px_var(--paper),0_0_2px_var(--paper)] ${lang === "hi" ? "font-hi" : ""}`}>
                {pick(ch, "title", lang)}
                {ch.track === "tradition" ? " · tradition" : ""}
              </div>
            ) : null}
          </div>
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            spacing={0}
            value={trackFilter}
            onValueChange={(v) => {
              if (!v) return;
              setTrackFilter(v as TrackFilter);
              // Sections re-measure after the filter applies; seek on the next frame.
              requestAnimationFrame(() => seek({ chapter: 0, progress: 0 }));
            }}
            aria-label="Track"
            className="pointer-events-auto absolute left-4 top-14 bg-paper/85 backdrop-blur-sm lg:left-6 lg:top-16"
          >
            {(["both", "evidence", "tradition"] as const).map((t) => (
              <ToggleGroupItem
                key={t}
                value={t}
                className={`text-[11px] capitalize ${
                  t === "tradition" ? "data-[state=on]:bg-tradition data-[state=on]:text-paper" : "data-[state=on]:bg-ink data-[state=on]:text-paper"
                }`}
              >
                {t}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="pointer-events-auto absolute inset-x-0 bottom-0 bg-gradient-to-t from-paper via-paper/85 to-transparent px-4 pb-3 pt-10 lg:px-6">
            <Scrubber chapters={chapters} eventsByChapter={eventsByChapter} pos={pos} onSeek={seek} />
          </div>
        </div>

        {/* Play controls: the story can run itself. Phones: under the readout, clear of the bottom card and the scrubber's year. */}
        <div
          inert={!inStory}
          className={`fixed right-4 top-[120px] z-10 flex items-center gap-1 rounded-full border border-hair bg-paper/90 p-1 shadow-sm backdrop-blur-md transition-opacity duration-500 lg:bottom-[104px] lg:right-6 lg:top-auto ${inStory ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <Button size="icon-sm" variant="ghost" onClick={() => skip(-1)} aria-label="Previous" disabled={!inStory} className="rounded-full">
            <SkipBack />
          </Button>
          <Button
            size={inStory ? "icon-sm" : "sm"}
            variant="default"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            aria-pressed={playing}
            className={`rounded-full ${playing ? "animate-pulse" : ""}`}
          >
            {playing ? <Pause /> : <Play />}
            {inStory ? null : <span className="pr-1">Play the story</span>}
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => skip(1)} aria-label="Next" className="rounded-full">
            <SkipForward />
          </Button>
        </div>

        {/* What pops on the map */}
        <AnimatePresence mode="popLayout">{showTitle && ch ? <ChapterTitle key={`t-${ch.id}`} ch={ch} index={pos.chapter} frac={frac} /> : null}</AnimatePresence>
        <AnimatePresence>
          {inStory && active && !open ? <EventCallout key={active.id} ev={active} pin={pin} frac={frac} viewport={viewport} onOpen={openEvent} /> : null}
        </AnimatePresence>
        <AnimatePresence>{open ? <DetailOverlay key={`d-${open.id}`} ev={open} onClose={closeEvent} /> : null}</AnimatePresence>

        {/* On the hero, text scrolls up under the transparent header: fade it out beneath the logo. */}
        <div
          aria-hidden
          className={`pointer-events-none fixed inset-x-0 top-0 z-[3] h-16 bg-gradient-to-b from-paper via-paper/80 to-transparent transition-opacity duration-500 ${inStory ? "opacity-0" : "opacity-100"}`}
        />

        {/* The hero sits in the flow above the clock. */}
        <Intro chapters={chapters} eventCount={events.length} onPlay={togglePlay} onSeek={(c) => seek({ chapter: c, progress: 0.001 }, true)} />

        {/* Invisible spacers: one slot of scroll per title and per event. They are the clock. */}
        <div className="relative z-[1]" aria-hidden>
          {chapters.map((c, i) => {
            const n = (eventsByChapter[c.id]?.length ?? 0) + 1;
            return (
              <section
                key={c.id}
                id={c.id}
                ref={(el) => {
                  sectionRefs.current[i] = el;
                }}
                style={{ height: `${n * SLOT_VH}vh` }}
              />
            );
          })}
          <div style={{ height: "30vh" }} />
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
