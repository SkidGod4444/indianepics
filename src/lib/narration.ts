"use client";

import type { Story } from "./story";

/**
 * The narrator runs the story as one recording. Every line is scheduled on the audio clock ahead of its moment, so
 * lines join to the sample, and that same clock tells the page where it should be. Clips come from public/audio
 * (see scripts/build-voice.ts). A beat with no clip is silent and the clock keeps its time.
 *
 * With narration off, or when a phone will not give us audio, the story runs on the wall clock instead, so the
 * timeline never depends on sound. A phone call or an app switch pauses the story where it stands.
 */
export type Lang = "en" | "hi";
type Clip = { file: string; chars: number; seconds?: number };
export type VoiceManifest = { clips: Record<string, Partial<Record<Lang, Clip>>> };

export const VOICE_PREF_KEY = "indianepics:voice";
/** What the reader chose: a narration language, or off. Unset means "follow the page language". */
export type VoicePref = Lang | "off";
const BASE = "/audio/";

let manifestPromise: Promise<VoiceManifest | null> | undefined;
export function loadVoiceManifest(): Promise<VoiceManifest | null> {
  // Revalidate: force-cache would hold a returning reader on the manifest of their first visit, and every clip
  // added since would stay silent for them.
  manifestPromise ??= fetch(`${BASE}manifest.json`, { cache: "no-cache" })
    .then((r) => (r.ok ? (r.json() as Promise<VoiceManifest>) : null))
    .catch(() => null);
  return manifestPromise;
}

/** Length of a clip in ms, or 0 when the line has none in that language or in English. */
export function clipMs(manifest: VoiceManifest | null, key: string, lang: Lang) {
  const c = manifest?.clips[key];
  const clip = c?.[lang] ?? c?.en;
  if (!clip) return 0;
  return clip.seconds ? clip.seconds * 1000 : (clip.chars / 14) * 1000;
}

/** How far ahead a line is placed on the audio clock. */
const AHEAD_MS = 4000;
/** How close a line can get before the clock waits for it to finish arriving. */
const WAIT_MS = 400;
/** How many lines to keep decoded. One is about 6 MB of memory. */
const KEEP = 6;
/** How long to wait for audio to come up before carrying on without it. */
const WAKE_MS = 800;
/** How long a line may take to arrive before it is passed over in silence. */
const FETCH_MS = 15000;

export class Narrator {
  private manifest: VoiceManifest | null = null;
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private loading = new Map<string, Promise<AudioBuffer | null>>();
  private decoded = new Map<string, AudioBuffer | null>();
  private sounding = new Set<AudioBufferSourceNode>();
  private story: Story | null = null;
  private lang: Lang | null = null;
  /** Audio clock reading at story time zero. */
  private origin = 0;
  /** Story time shown until the clock starts. */
  private parked = 0;
  private running = false;
  private waiting = false;
  private paused = false;
  /** True when the story is timed by the wall clock, with no voice. */
  private wall = false;
  /** performance.now() reading at story time zero, on the wall clock. */
  private wallOrigin = 0;
  /** Next cue to place on the clock. */
  private cursor = 0;
  private timer = 0;
  /** Bumped by every start and stop, so an older start that finishes loading late does nothing. */
  private run = 0;
  onEnded: (() => void) | null = null;
  onState: (() => void) | null = null;
  /** The phone took the audio away mid-story: a call, or a switch to another app. */
  onInterrupted: (() => void) | null = null;

  setManifest(m: VoiceManifest | null) {
    this.manifest = m;
  }

  /** Must be called from a click or key press. Browsers only allow sound to start from one. */
  unlock() {
    try {
      if (!this.ctx || this.ctx.state === "closed") {
        // Without this an iPhone on silent plays nothing through Web Audio.
        const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
        if (session) session.type = "playback";
        const ctx = new AudioContext();
        this.ctx = ctx;
        this.out = ctx.createGain();
        this.out.connect(ctx.destination);
        ctx.onstatechange = () => {
          this.onState?.();
          if (this.running && !this.wall && !this.paused && !this.waiting && ctx.state !== "running") this.onInterrupted?.();
        };
      }
      void this.ctx.resume().catch(() => {});
    } catch {
      this.ctx = null;
    }
  }

  /** Asks for audio and says whether it came up in time. */
  private async wake() {
    const ctx = this.ctx;
    if (!ctx) return false;
    if (ctx.state !== "running") {
      await Promise.race([ctx.resume().catch(() => {}), new Promise((r) => window.setTimeout(r, WAKE_MS))]);
    }
    return this.ctx?.state === "running";
  }

  /** Story time now, in ms. This is the one clock: the page reads it every frame. */
  timeMs() {
    if (!this.running || (this.wall && this.paused)) return this.parked;
    if (this.wall || !this.ctx) return performance.now() - this.wallOrigin;
    return (this.ctx.currentTime - this.origin) * 1000;
  }

  /** True while the story is moving. */
  get playing() {
    return this.running && !this.paused && !!this.lang && !this.wall && this.ctx?.state === "running";
  }

  /** True when this story can carry on from where it stopped. A story that lost its voice starts the line again. */
  holds(story: Story) {
    return this.story === story && this.running && !(this.wall && this.lang);
  }

  private srcFor(key: string) {
    const lang = this.lang;
    if (!lang) return null;
    const c = this.manifest?.clips[key];
    const clip = c?.[lang] ?? c?.en;
    return clip ? `${BASE}${clip.file}` : null;
  }

  /** Fetches and decodes a line once, and keeps the last few. */
  private load(src: string) {
    const ctx = this.ctx;
    let job = this.loading.get(src);
    if (job || !ctx) return job ?? Promise.resolve(null);
    job = fetch(src, { signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(FETCH_MS) : undefined })
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(src))))
      .then((data) => ctx.decodeAudioData(data))
      .catch(() => null)
      .then((buffer) => {
        this.decoded.set(src, buffer);
        const oldest = this.decoded.size > KEEP ? this.decoded.keys().next().value : undefined;
        if (oldest) {
          this.decoded.delete(oldest);
          this.loading.delete(oldest);
        }
        return buffer;
      });
    this.loading.set(src, job);
    return job;
  }

  private hush() {
    for (const s of this.sounding) {
      s.onended = null;
      s.stop();
    }
    this.sounding.clear();
  }

  private silence() {
    this.hush();
    window.clearInterval(this.timer);
    this.waiting = false;
    this.running = false;
    this.paused = false;
  }

  /**
   * Plays the story from a cue. The clock holds at that cue until its line is ready, so the page can rest there.
   * `delayMs` lets a dragged scrubber settle before anything is fetched.
   */
  async start(story: Story, index: number, lang: Lang | null, delayMs = 0) {
    const run = ++this.run;
    this.silence();
    this.story = story;
    this.lang = lang;
    this.cursor = index;
    const cue = story.cues[index];
    this.parked = cue.start;
    if (delayMs) await new Promise((r) => window.setTimeout(r, delayMs));
    if (run !== this.run) return;
    const voiced = !!lang && (await this.wake());
    if (run !== this.run) return;
    const src = voiced && cue.key ? this.srcFor(cue.key) : null;
    if (src) await this.load(src);
    if (run !== this.run) return;
    const ctx = this.ctx;
    this.wall = !voiced || ctx?.state !== "running";
    if (ctx && !this.wall) this.origin = ctx.currentTime + 0.05 - cue.start / 1000;
    this.wallOrigin = performance.now() - cue.start;
    this.running = true;
    this.pump();
    this.timer = window.setInterval(() => this.pump(), 250);
    this.onState?.();
  }

  /** Places every line due soon on the clock. Runs on a timer, so it keeps going in a background tab. */
  private pump() {
    const { story } = this;
    if (!story || this.waiting) return;
    const now = this.timeMs();
    const cues = story.cues;
    const lineOf = (i: number) => {
      const key = cues[i].key;
      return !this.wall && key ? this.srcFor(key) : null;
    };
    for (let i = this.cursor; i < Math.min(cues.length, this.cursor + 3); i++) {
      const src = lineOf(i);
      if (src) void this.load(src);
    }
    while (this.cursor < cues.length) {
      const cue = cues[this.cursor];
      const at = cue.start + cue.lead;
      if (at - now > AHEAD_MS) break;
      const src = lineOf(this.cursor);
      if (src) {
        const buffer = this.decoded.get(src);
        if (buffer === undefined) {
          if (at - now < WAIT_MS) this.wait(src);
          break;
        }
        if (buffer) this.place(buffer, at);
      }
      this.cursor++;
    }
    if (now >= story.length) {
      this.stop();
      this.onEnded?.();
    }
  }

  /** On a slow connection the whole film holds, voice and picture together, until the next line arrives. */
  private wait(src: string) {
    const ctx = this.ctx;
    const run = this.run;
    if (!ctx) return;
    this.waiting = true;
    void ctx.suspend();
    void this.load(src).then(async () => {
      if (run !== this.run) return;
      await ctx.resume();
      this.waiting = false;
      this.pump();
    });
  }

  private place(buffer: AudioBuffer, at: number) {
    const { ctx, out } = this;
    if (!ctx || !out) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(out);
    source.onended = () => this.sounding.delete(source);
    source.start(Math.max(ctx.currentTime, this.origin + at / 1000));
    this.sounding.add(source);
  }

  pause() {
    window.clearInterval(this.timer);
    this.parked = this.timeMs();
    this.paused = true;
    if (!this.wall) void this.ctx?.suspend().catch(() => {});
    this.onState?.();
  }

  async resume() {
    const run = this.run;
    if (!this.wall && !(await this.wake())) {
      if (run !== this.run) return;
      // The phone will not give the audio back. The story carries on without the voice sooner than freeze.
      this.hush();
      this.wall = true;
    }
    if (run !== this.run) return;
    this.wallOrigin = performance.now() - this.parked;
    this.paused = false;
    window.clearInterval(this.timer);
    this.timer = window.setInterval(() => this.pump(), 250);
    this.onState?.();
  }

  stop() {
    this.run++;
    this.silence();
    this.story = null;
    this.onState?.();
  }
}
