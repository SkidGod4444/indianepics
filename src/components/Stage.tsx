"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from "motion/react";
import type { BookChapter, BookEvent, Polity, Prologue, Track } from "@/content/schema";
import { useLang } from "@/lib/i18n";
import { pick } from "@/lib/text";
import { activeIndexAt, clamp01, readoutAt, slotAt, type Position } from "@/lib/timeline";
import { BASE_ERA, applyEra, eraFor } from "@/lib/eras";
import { Scrubber } from "./Scrubber";
import { Book, type Page } from "./Book";
import { Intro } from "./Intro";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { GripVertical, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Narrator, VOICE_PREF_KEY, clipMs, loadVoiceManifest, type VoiceManifest, type VoicePref } from "@/lib/narration";
import { buildStory, cueAt, cueFor, slotFrac, type Cue } from "@/lib/story";
import { VoiceMenu } from "./VoiceMenu";
import dynamic from "next/dynamic";
import { crossedTurn, LAND, leafAngle, TURN_SHARE } from "@/lib/turn";
import { onPageSoundAwake, playPageSound, wakePageSound } from "@/lib/pageSound";
import { useDrag } from "@/lib/useDrag";
import { loadSketch } from "./Sketch";

type Props = { chapters: BookChapter[]; events: BookEvent[]; polities: Polity[]; prologue?: Prologue | null };
type TrackFilter = "both" | Track;

/** The point in the viewport that "is now". */
const ANCHOR = 0.5;
/** Scroll length of one slot (a chapter title or one event), in vh. One number to tune the pacing. */
const SLOT_VH = 80;
/** A page at rest needs the page's state only this often, in pixels of scrolling. A page turning follows every pixel. */
const REST_STEP_PX = 12;
/** Scrolling so fast that a turn would be over in this long: nobody can see the bend, so the page just changes. */
const FLING_TURN_MS = 100;
const FLING_SETTLE_MS = 140;
/** The old borders move to the new chapter's while its first event is read, in this share of that slot after the turn. */
const SHIFT_SHARE = 0.33;
/** A sideways swipe of this many pixels turns a page. */
/** Most readers never open a page in full, so its code stays out of the first load. */
const DetailOverlay = dynamic(() => import("./DetailOverlay").then((m) => m.DetailOverlay), { ssr: false });
/** The map lies under the title page at first, so its code and coastlines wait until that page is on screen. */
const MapStage = dynamic(() => import("./MapStage").then((m) => m.MapStage), { ssr: false });
const MAP_DELAY_MS = 1200;

const SWIPE_PX = 60;
const PAPER_KEY = "indianepics:paper-sound";
/** How long the page takes to lift off the hero at the end of the prologue. */
const GLIDE_MS = 1600;

export function Stage({ chapters: allChapters, events, polities, prologue }: Props) {
  const { lang } = useLang();
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("both");
  const [pos, setPos] = useState<Position>({ chapter: 0, progress: 0 });
  const [inStory, setInStory] = useState(false);
  /** How far the hero's page has turned, 0 to 1. */
  const [heroTurn, setHeroTurn] = useState(0);
  const [open, setOpen] = useState<BookEvent | null>(null);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const [playing, setPlaying] = useState(false);
  /** Narration choice: a language, "off", or null to follow the page language. */
  const [voicePref, setVoicePref] = useState<VoicePref | null>(null);
  const [paperSound, setPaperSound] = useState(true);
  const [soundAwake, setSoundAwake] = useState(false);
  const player = useRef<HTMLDivElement>(null);
  const movePlayer = useDrag(player, "indianepics:player");
  const [manifest, setManifest] = useState<VoiceManifest | null>(null);
  const voiceReady = !!manifest && Object.keys(manifest.clips).length > 0;
  const [narrating, setNarrating] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  /** Slots in each chapter, for the scroll handler. */
  const slotCounts = useRef<number[]>([]);
  const [flinging, setFlinging] = useState(false);
  const pushedRef = useRef(false);
  const narratorRef = useRef<Narrator | null>(null);
  const voiceLang = voicePref === "off" ? null : (voicePref ?? lang);
  const voiceOn = voiceLang !== null;
  /** True while the prologue is being read over the hero. */
  const [prologueOn, setPrologueOn] = useState(false);
  /** Where the page stood when Play was paused: resuming from the same spot carries on mid-sentence. */
  const pausedAtRef = useRef<number | null>(null);
  /** While playing, moves the story to a place on the page and keeps playing. */
  const jumpRef = useRef<((p: Position) => void) | null>(null);

  // The narrator: clips from public/audio, if `bun run voice` has been run. Silent otherwise.
  useEffect(() => {
    const n = (narratorRef.current ??= new Narrator());
    n.onState = () => setNarrating(n.playing);
    n.onInterrupted = () => setPlaying(false);
    n.onEnded = () => {
      setPlaying(false);
      // The last line leads into the closing pages of the book.
      (document.getElementById("ledger") ?? document.getElementById("index"))?.scrollIntoView({ behavior: "smooth" });
    };
    loadVoiceManifest().then((m) => {
      try {
        const v = window.localStorage.getItem(VOICE_PREF_KEY);
        if (v === "en" || v === "hi" || v === "off") setVoicePref(v);
        if (window.localStorage.getItem(PAPER_KEY) === "off") setPaperSound(false);
      } catch {}
      n.setManifest(m);
      setManifest(m);
    });
  }, []);
  const chooseVoice = (v: VoicePref) => {
    setVoicePref(v);
    try {
      window.localStorage.setItem(VOICE_PREF_KEY, v);
    } catch {}
  };

  const chapters = useMemo(
    () => allChapters.filter((c) => trackFilter === "both" || c.track === trackFilter),
    [allChapters, trackFilter],
  );
  const eventsByChapter = useMemo(() => {
    const m: Record<string, BookEvent[]> = {};
    for (const e of events) {
      if (trackFilter !== "both" && e.track !== trackFilter) continue;
      (m[e.chapter] ??= []).push(e);
    }
    return m;
  }, [events, trackFilter]);

  useEffect(() => {
    slotCounts.current = chapters.map((c) => (eventsByChapter[c.id]?.length ?? 0) + 1);
  }, [chapters, eventsByChapter]);

  // The film: every line in order, in the chosen voice. A new language or track rebuilds it and Play restarts the line.
  const story = useMemo(
    () => buildStory(chapters, eventsByChapter, (key) => (voiceLang ? clipMs(manifest, key, voiceLang) : 0), prologue ? "prologue" : undefined),
    [chapters, eventsByChapter, voiceLang, manifest, prologue],
  );

  // Viewport → projection. The map is the stage; everything else is placed on it.
  useEffect(() => {
    const measure = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const [mapWanted, setMapWanted] = useState(false);
  useEffect(() => {
    const want = () => setMapWanted(true);
    const timer = window.setTimeout(want, window.scrollY > 0 ? 0 : MAP_DELAY_MS);
    window.addEventListener("scroll", want, { once: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", want);
    };
  }, []);

  /** Where the anchor line is, in the spacer sections: chapter index, progress, and that section's page box. */
  const locate = useCallback(() => {
    const anchor = window.innerHeight * ANCHOR;
    const els = sectionRefs.current.filter(Boolean) as HTMLElement[];
    let hit: { i: number; progress: number; top: number; height: number } | null = null;
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect();
      if (anchor < r.top) break;
      hit = { i, progress: clamp01((anchor - r.top) / r.height), top: r.top + window.scrollY, height: r.height };
    }
    return hit;
  }, []);

  // Scroll → position, measured from the invisible spacer sections.
  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    let lastAt = performance.now();
    let flingTimer = 0;
    // Spacer positions, measured once and again on resize. Reading them per frame would force a layout on every scroll.
    let spans: { top: number; height: number }[] = [];
    const measure = () => {
      const els = sectionRefs.current.filter(Boolean) as HTMLElement[];
      spans = els.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top + window.scrollY, height: r.height };
      });
    };
    const update = () => {
      raf = 0;
      if (!spans.length) measure();
      if (!spans.length) return;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const anchor = vh * ANCHOR + y;
      const now = performance.now();
      const turnPx = TURN_SHARE * (SLOT_VH / 100) * vh;
      if (Math.abs(y - lastY) / Math.max(1, now - lastAt) > turnPx / FLING_TURN_MS) {
        setFlinging(true);
        window.clearTimeout(flingTimer);
        flingTimer = window.setTimeout(() => setFlinging(false), FLING_SETTLE_MS);
      }
      lastY = y;
      lastAt = now;
      const start = spans[0].top;
      const tail = spans[spans.length - 1];
      // In the story between the first spacer's top and the last spacer's bottom; the hero before it and the index after it are plain pages.
      setInStory(start - y < vh * 0.55 && tail.top + tail.height - y > vh * 0.55);
      // The hero's page turns over the first stretch of scrolling, and lands as the story starts.
      setHeroTurn(clamp01(y / Math.max(1, start - vh * 0.55)));
      let next: Position = { chapter: 0, progress: 0 };
      for (let i = 0; i < spans.length; i++) {
        if (anchor < spans[i].top) break;
        next = { chapter: i, progress: clamp01((anchor - spans[i].top) / spans[i].height) };
      }
      setPos((p) => {
        if (p.chapter !== next.chapter) return next;
        const turning = (q: Position) => {
          const x = q.progress * (slotCounts.current[q.chapter] ?? 1);
          return x - Math.floor(x) < TURN_SHARE;
        };
        const px = Math.abs(p.progress - next.progress) * spans[next.chapter].height;
        return px < (turning(p) || turning(next) ? 0.5 : REST_STEP_PX) ? p : next;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(flingTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [chapters.length]);

  const seekToRef = useRef<(p: Position, smooth?: boolean) => void>(() => {});
  const seek = useCallback((p: Position, smooth = false) => {
    const el = sectionRefs.current[p.chapter];
    if (!el) return;
    const r = el.getBoundingClientRect();
    const top = window.scrollY + r.top + clamp01(p.progress) * r.height - window.innerHeight * ANCHOR + 1;
    window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
  }, []);
  /** The first page of a chapter, from the title page. */
  const seekChapter = useCallback((c: number) => seekToRef.current({ chapter: c, progress: 0.001 }, true), []);
  /** A reader's jump: during Play the film goes there and carries on, otherwise the page simply scrolls. */
  const seekTo = useCallback(
    (p: Position, smooth = false) => {
      if (jumpRef.current) jumpRef.current(p);
      else seek(p, smooth);
    },
    [seek],
  );
  useEffect(() => {
    seekToRef.current = seekTo;
  }, [seekTo]);

  // Play: one clock, the narrator's. The page's position is worked out from it every frame, so the timeline
  // cannot drift from the voice. A deliberate scroll hands control back to the reader.
  useEffect(() => {
    if (!playing) return;
    const n = narratorRef.current;
    if (!n) return;
    const yFor = (cue: Cue, t: number) => {
      const el = sectionRefs.current[cue.chapter];
      if (!el) return window.scrollY;
      const r = el.getBoundingClientRect();
      return r.top + window.scrollY + ((cue.slot + slotFrac(cue, t)) / cue.slots) * r.height - window.innerHeight * ANCHOR + 1;
    };
    let glideFrom = window.scrollY;
    // The prologue holds on the hero, then the page lifts away as its last words end, landing on chapter one.
    const yForPrologue = (cue: Cue, t: number) => {
      const first = story.cues[1];
      if (!first) return glideFrom;
      const k = clamp01((t - (cue.voice - GLIDE_MS)) / GLIDE_MS);
      return glideFrom + (yFor(first, first.start) - glideFrom) * (k * k * (3 - 2 * k));
    };
    const slotOf = (p: Position) => slotAt(p.progress, eventsByChapter[chapters[p.chapter]?.id]?.length ?? 0).slot;
    const begin = (i: number, delayMs = 0) => {
      const cue = story.cues[i];
      if (cue.chapter >= 0) window.scrollTo(0, yFor(cue, cue.start));
      glideFrom = window.scrollY;
      void n.start(story, i, voiceLang, delayMs);
    };
    jumpRef.current = (p) => begin(cueFor(story, p.chapter, slotOf(p)), 120);

    const back = pausedAtRef.current;
    pausedAtRef.current = null;
    if (back !== null && n.holds(story) && Math.abs(window.scrollY - back) < 3) void n.resume();
    else {
      const here = locate();
      begin(here ? cueFor(story, here.i, slotOf({ chapter: here.i, progress: here.progress })) : 0);
    }

    let raf = 0;
    let prologueShown = false;
    const tick = () => {
      const t = n.timeMs();
      const cue = story.cues[cueAt(story, t)];
      const onPrologue = cue.chapter < 0;
      const y = onPrologue ? yForPrologue(cue, t) : yFor(cue, t);
      if (Math.abs(y - window.scrollY) > 0.4) window.scrollTo(0, y);
      if (onPrologue !== prologueShown) {
        prologueShown = onPrologue;
        setPrologueOn(onPrologue);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const pause = () => setPlaying(false);
    // A flick of the trackpad just before pressing Play coasts on for a moment: that is not the reader taking over.
    const armedAt = performance.now() + 900;
    let wheelSum = 0;
    let wheelAt = 0;
    const onWheel = (e: WheelEvent) => {
      const now = performance.now();
      if (now < armedAt) return;
      wheelSum = (now - wheelAt > 300 ? 0 : wheelSum) + Math.abs(e.deltaY) + Math.abs(e.deltaX);
      wheelAt = now;
      if (wheelSum > 60) pause();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key)) pause();
    };
    // A voice keeps going in another tab, like any recording. A silent story waits for its reader.
    const onHide = () => {
      if (document.hidden && !voiceLang) pause();
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    // Moving the player about is not the reader taking over.
    const onTouchMove = (e: TouchEvent) => {
      if (!(e.target instanceof Element && e.target.closest("[data-player]"))) pause();
    };
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("keydown", onKey);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onHide);
      jumpRef.current = null;
      pausedAtRef.current = window.scrollY;
      n.pause();
      setPrologueOn(false);
    };
  }, [playing, story, voiceLang, chapters, eventsByChapter, locate]);

  const togglePlay = useCallback(() => {
    if (!playing) narratorRef.current?.unlock();
    setPlaying(!playing);
  }, [playing]);

  // Space toggles play when nothing else has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " && (e.target === document.body || e.target === document.documentElement)) {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay]);

  // In-page detail: pushState so the URL is shareable and Back closes it. No navigation.
  const openEvent = useCallback((ev: BookEvent) => {
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
  const wide = viewport.w >= 1024;
  const reduce = useReducedMotion() ?? false;

  // The book: where the reader is, the page being turned away, and how far it has come.
  const pageOf = (c: number, s: number): Page | null => {
    const chapter = chapters[c];
    if (!chapter) return null;
    if (s <= 0) return { kind: "opener", ch: chapter, index: allChapters.indexOf(chapter) };
    const ev = eventsByChapter[chapter.id]?.[s - 1];
    return ev ? { kind: "event", ch: chapter, ev } : null;
  };
  const cur = pageOf(pos.chapter, slot);
  const before = slot > 0 ? pageOf(pos.chapter, slot - 1) : pos.chapter > 0 ? pageOf(pos.chapter - 1, eventsByChapter[chapters[pos.chapter - 1]?.id]?.length ?? 0) : null;
  const cue = story.cues[cueFor(story, pos.chapter, slot)];
  const turn = before ? clamp01(frac / TURN_SHARE) : 1;
  const nowRef = useRef({ cue, playing });
  useEffect(() => {
    nowRef.current = { cue, playing };
  });
  /** How much of a cue's sketch belongs on the page: the narrator's clock while the story plays or is paused right here. */
  const penOn = useCallback((c: Cue | undefined) => {
    const n = narratorRef.current;
    if (!n || !c) return null;
    const pausedAt = pausedAtRef.current;
    const held = pausedAt !== null && Math.abs(window.scrollY - pausedAt) < 3;
    if (!nowRef.current.playing && !held) return null;
    return clamp01((n.timeMs() - c.start) / (c.lead + c.voice));
  }, []);
  const chapterPen = useCallback(() => penOn(nowRef.current.cue), [penOn]);
  const prologuePen = useCallback(() => penOn(story.cues[0]?.chapter === -1 ? story.cues[0] : undefined), [penOn, story]);
  const prevPage = inStory && turn < 1 && !flinging ? before : null;
  // A page number for every page in the book.
  const folio = useMemo(() => {
    const offset: number[] = [];
    let n = 1;
    for (const c of chapters) {
      offset.push(n);
      n += (eventsByChapter[c.id]?.length ?? 0) + 1;
    }
    return offset;
  }, [chapters, eventsByChapter]);
  const folioNow = (folio[pos.chapter] ?? 1) + slot;
  const pageCount = chapters.length + events.length;
  // A browser keeps a page silent until the reader clicks, taps or presses a key, so the sound wakes on the first of those.
  useEffect(() => {
    const gestures = ["pointerdown", "pointerup", "touchend", "keydown"] as const;
    gestures.forEach((g) => window.addEventListener(g, wakePageSound, { passive: true }));
    const stop = onPageSoundAwake(setSoundAwake);
    return () => {
      gestures.forEach((g) => window.removeEventListener(g, wakePageSound));
      stop();
    };
  }, []);
  const choosePaper = (on: boolean) => {
    setPaperSound(on);
    try {
      localStorage.setItem(PAPER_KEY, on ? "on" : "off");
    } catch {
      // A private window: it lasts until the page is closed.
    }
  };
  const lastTurn = useRef({ page: "", story: 1, hero: 0 });
  useEffect(() => {
    const was = lastTurn.current;
    const page = `${pos.chapter}:${slot}`;
    const lifted = (was.page === page && crossedTurn(was.story, turn)) || crossedTurn(was.hero, heroTurn);
    lastTurn.current = { page, story: turn, hero: heroTurn };
    if (lifted && paperSound && !reduce) playPageSound(playing && voiceOn);
  }, [pos.chapter, slot, turn, heroTurn, paperSound, reduce, playing, voiceOn]);
  // On a phone the map itself turns away when a chapter's opener is under it.
  const mapTurn = !wide && !reduce && slot === 0 && prevPage?.kind === "event" ? leafAngle(turn, 92) : 0;
  // While a chapter's first page turns in, the map still shows the chapter before, until the leaf covers it.
  const leftOld = slot === 0 && !!prevPage && turn < LAND;
  const mapPos: Position = leftOld ? { chapter: pos.chapter - 1, progress: 0.9999 } : pos;
  const mapEvents = leftOld ? eventsByChapter[chapters[pos.chapter - 1]?.id] ?? [] : chEvents;
  const mapActive = leftOld ? (mapEvents[mapEvents.length - 1] ?? null) : active;
  const mapVisible = leftOld ? mapEvents : visible;

  // Book gestures. Scrolling down always works; these add the book's own direction.
  const skipRef = useRef<(dir: 1 | -1) => void>(() => {});
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) window.scrollBy(0, e.deltaX);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [role=slider], [role=radio], [role=dialog]")) return;
      skipRef.current(e.key === "ArrowRight" ? 1 : -1);
    };
    let startX = 0;
    let startY = 0;
    let armed = false;
    const onTouchStart = (e: TouchEvent) => {
      armed = e.touches.length === 1 && !(e.target instanceof HTMLElement && e.target.closest("[data-no-swipe]"));
      startX = e.touches[0]?.clientX ?? 0;
      startY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!armed) return;
      armed = false;
      const dx = (e.changedTouches[0]?.clientX ?? startX) - startX;
      const dy = (e.changedTouches[0]?.clientY ?? startY) - startY;
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.5) skipRef.current(dx < 0 ? 1 : -1);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);
  // Fetch the next chapter's sketch ahead of time, so its opener starts drawing at once.
  useEffect(() => {
    const next = chapters[pos.chapter + 1];
    if (inStory && next) void loadSketch(next.id).catch(() => {});
  }, [inStory, pos.chapter, chapters]);

  /** Jump to the middle of the previous/next slot, across chapter boundaries. */
  const skip = (dir: 1 | -1) => {
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
    seekTo({ chapter: c, progress: (s + 0.5) / slotsOf(c) }, true);
  };
  useEffect(() => {
    skipRef.current = skip;
  });

  return (
    // Reduced motion: motion skips transform and layout animations (the CSS rule in globals.css covers the rest).
    <MotionConfig reducedMotion="user">
      <LayoutGroup>
        {/* The stage: a centred map that stays put while the page scrolls underneath. */}
        <div
          className={`fixed inset-0 transition-opacity duration-700 ${mapTurn ? "z-[6]" : "z-0"} ${inStory ? "opacity-100" : "opacity-0"}`}
          style={mapTurn ? { transform: `perspective(1400px) rotateY(${mapTurn}deg)`, transformOrigin: "left center", willChange: "transform" } : undefined}
          aria-hidden={!inStory}
        >
          <div className="grain era-pattern relative h-full w-full">
            {mapWanted ? (
              <MapStage
                size={viewport}
                chapters={chapters}
                polities={polities}
                visible={mapVisible}
                pos={mapPos}
                turn={leftOld ? 1 : turn}
                shift={leftOld || slot > 1 ? 1 : slot === 0 ? 0 : clamp01((frac - TURN_SHARE) / SHIFT_SHARE)}
                activeEventId={mapActive?.id ?? null}
                onPick={openEvent}
              />
            ) : null}
            <div className={wide ? "spine" : "map-age"} aria-hidden />
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
          <div className="pointer-events-auto absolute right-4 top-14 text-right lg:right-11 lg:top-[70px]">
            <div className="font-display text-[clamp(1.6rem,5vw,4rem)] leading-none text-ink tabular-nums [text-shadow:0_0_18px_var(--paper)]">
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
            className="pointer-events-auto absolute left-4 top-14 bg-paper/95 max-[350px]:hidden lg:left-11 lg:top-[78px]"
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
            <Scrubber chapters={chapters} eventsByChapter={eventsByChapter} pos={pos} onSeek={seekTo} />
          </div>
        </div>

        {/* Play controls: the story can run itself. Phones: under the readout, clear of the bottom card and the scrubber's year. */}
        <div
          ref={player}
          data-player
          data-no-swipe
          inert={!inStory}
          className={`player fixed right-4 top-[120px] z-20 flex items-center gap-1 rounded-full border border-hair bg-paper/95 p-1 shadow-sm transition-opacity duration-500 lg:bottom-[104px] lg:right-11 lg:top-auto ${inStory ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <button
            type="button"
            onKeyDown={movePlayer}
            aria-label="Move the player. Drag it, or use the arrow keys."
            title="Drag to move"
            className="grid h-7 w-4 cursor-grab place-items-center rounded-full text-ink-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <GripVertical className="size-3.5" />
          </button>
          <Button size="icon-sm" variant="ghost" onClick={() => skip(-1)} aria-label="Previous" disabled={!inStory} className="rounded-full">
            <SkipBack />
          </Button>
          <Button
            size={inStory ? "icon-sm" : "sm"}
            variant="default"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            aria-pressed={playing}
            className="rounded-full"
          >
            {playing ? <Pause /> : <Play />}
            {inStory ? null : <span className="pr-1">Play the story</span>}
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => skip(1)} aria-label="Next" className="rounded-full">
            <SkipForward />
          </Button>
          {voiceReady ? <VoiceMenu value={voicePref ?? lang} narrating={narrating && voiceOn} onChange={chooseVoice} paper={paperSound} onPaper={choosePaper} /> : null}
          {/* Hangs below the player: it goes on the first press, and taking up room would pull Play out from under the pointer. */}
          {paperSound && !soundAwake ? (
            <button
              type="button"
              onClick={wakePageSound}
              className={`absolute right-1 top-full mt-1.5 whitespace-nowrap rounded-full border border-hair bg-paper/95 px-2 py-0.5 text-ink-2 shadow-sm hover:text-ink ${lang === "hi" ? "font-hi text-[12px]" : "text-[11px]"}`}
            >
              {lang === "hi" ? "आवाज़ के लिए टैप करें" : "Tap for sound"}
            </button>
          ) : null}
        </div>

        {/* What pops on the map */}
        {(inStory || (heroTurn > 0 && heroTurn < 1)) && cur && !open ? (
          <Book
            cur={cur}
            prev={prevPage}
            t={turn}
            folio={folioNow}
            done={folioNow / pageCount}
            wide={wide}
            reduce={reduce}
            pen={slot === 0 ? chapterPen : undefined}
            onOpen={openEvent}
          />
        ) : null}
        <AnimatePresence>{open ? <DetailOverlay key={`d-${open.id}`} ev={open} onClose={closeEvent} /> : null}</AnimatePresence>

        {/* The prologue's words, as a caption while it is read over the hero. */}
        <AnimatePresence>
          {prologueOn && prologue ? (
            <motion.p
              key="prologue"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.6 }}
              className={`pointer-events-none fixed inset-x-4 bottom-6 z-[4] mx-auto max-w-[58ch] rounded-2xl border border-hair bg-paper/95 px-6 py-3.5 lg:bottom-[116px] text-center text-[clamp(15px,1.6vw,19px)] leading-snug text-ink-2 shadow-md ${
                (voiceLang ?? lang) === "hi" ? "font-hi" : "font-display italic"
              }`}
            >
              {(voiceLang ?? lang) === "hi" ? prologue.voice_hi ?? prologue.voice : prologue.voice}
            </motion.p>
          ) : null}
        </AnimatePresence>

        {/* Past the story the page is long text that scrolls under the header: fade it out beneath the logo. */}
        {!inStory && heroTurn >= 1 ? <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-20 h-[68px] bg-gradient-to-b from-paper from-70% to-transparent" /> : null}

        {/* The hero is the title page. It stays put and turns; this height of scroll is what turns it. */}
        <Intro chapters={chapters} playing={playing} pen={prologuePen} turn={heroTurn} wide={wide} reduce={reduce} onPlay={togglePlay} onSeek={seekChapter} />

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
