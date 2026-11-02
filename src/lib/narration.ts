"use client";

/**
 * The narrator: one <audio> element, created on the reader's Play click so every browser allows it,
 * that reads the clip for whatever slot the story is on. Clips come from public/audio (see
 * scripts/build-voice.ts); a slot with no clip is simply silent and the scroll keeps its own time.
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

export class Narrator {
  private audio: HTMLAudioElement | null = null;
  private next: HTMLAudioElement | null = null;
  private nextSrc = "";
  private manifest: VoiceManifest | null = null;
  /** Key of the clip now loaded (playing or paused). */
  current: string | null = null;
  muted = false;
  onEnded: ((key: string) => void) | null = null;
  onState: (() => void) | null = null;

  constructor(manifest: VoiceManifest | null = null) {
    this.manifest = manifest;
  }

  setManifest(m: VoiceManifest | null) {
    this.manifest = m;
  }

  /** True when any clip at all exists: decides whether the voice toggle is shown. */
  get available() {
    return !!this.manifest && Object.keys(this.manifest.clips).length > 0;
  }

  /** Must be called from a user gesture once; afterwards play() works from timers and rAF. */
  unlock() {
    if (this.audio) return;
    const a = new Audio();
    a.preload = "auto";
    a.addEventListener("ended", () => {
      const k = this.current;
      this.onState?.();
      if (k) this.onEnded?.(k);
    });
    a.addEventListener("play", () => this.onState?.());
    a.addEventListener("pause", () => this.onState?.());
    this.audio = a;
  }

  has(key: string, lang: Lang) {
    return !!this.srcFor(key, lang);
  }

  srcFor(key: string, lang: Lang): string | null {
    const c = this.manifest?.clips[key];
    const clip = c?.[lang] ?? c?.en;
    return clip ? `${BASE}${clip.file}` : null;
  }

  /** Expected length in ms before metadata arrives: ~14 characters a second, spoken. */
  estimateMs(key: string, lang: Lang) {
    const c = this.manifest?.clips[key];
    const clip = c?.[lang] ?? c?.en;
    if (!clip) return 0;
    return clip.seconds ? clip.seconds * 1000 : (clip.chars / 14) * 1000;
  }

  /** Known length in ms once the clip's metadata has loaded, else the estimate. */
  durationMs(key: string, lang: Lang) {
    const a = this.audio;
    if (a && this.current === key && Number.isFinite(a.duration) && a.duration > 0) return a.duration * 1000;
    return this.estimateMs(key, lang);
  }

  elapsedMs(key: string) {
    const a = this.audio;
    return a && this.current === key ? a.currentTime * 1000 : 0;
  }

  get playing() {
    const a = this.audio;
    return !!a && !a.paused && !a.ended;
  }

  /** Start (or resume) the clip for a key. Returns false when there is nothing to say. */
  play(key: string, lang: Lang): boolean {
    const a = this.audio;
    const src = this.srcFor(key, lang);
    if (!a || !src) return false;
    if (this.current !== key || !a.src.endsWith(src)) {
      a.src = src;
      a.currentTime = 0;
      this.current = key;
    }
    a.muted = this.muted;
    void a.play().catch(() => {});
    return true;
  }

  preload(key: string, lang: Lang) {
    const src = this.srcFor(key, lang);
    if (!src || src === this.nextSrc) return;
    this.next ??= new Audio();
    this.next.preload = "auto";
    this.next.src = src;
    this.nextSrc = src;
  }

  pause() {
    this.audio?.pause();
  }

  stop() {
    const a = this.audio;
    if (!a) return;
    a.pause();
    a.removeAttribute("src");
    a.load();
    this.current = null;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.audio) this.audio.muted = m;
  }
}
