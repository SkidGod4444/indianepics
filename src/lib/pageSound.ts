/**
 * The sound of a page. Three short recordings of paper from pdsounds.org, public domain, via Wikimedia Commons:
 * "Turning a page" by planish and "Book, Paper, Pages, assorted" by stephan.
 *
 * Browsers keep a page silent until the reader clicks, taps or presses a key, and scrolling does not count, so the
 * sound wakes on the first of those. It has its own audio context, so it can never disturb the narrator's clock.
 */
const CLIPS = ["/audio/sfx/page-1.mp3", "/audio/sfx/page-2.mp3", "/audio/sfx/page-3.mp3"];
/** Beside the narrator a page sits well under the voice. */
const LEVEL = { alone: 0.34, underVoice: 0.13 };
const COOLDOWN_MS = 250;
const MAX_PER_SECOND = 3;
const RATE_SPREAD = 0.06;

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
let clips: AudioBuffer[] = [];
let last = -1;
let heard: number[] = [];
let awake = false;
const listeners = new Set<(awake: boolean) => void>();

async function load(context: AudioContext) {
  const loaded = await Promise.all(
    CLIPS.map((url) =>
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((data) => context.decodeAudioData(data))
        .catch(() => null),
    ),
  );
  clips = loaded.filter((clip): clip is AudioBuffer => !!clip);
}

/** Call from a click, tap or key press. Safe to call on every one. */
export function wakePageSound() {
  try {
    if (!ctx) {
      ctx = new AudioContext();
      out = ctx.createGain();
      out.connect(ctx.destination);
      void load(ctx);
    }
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    if (!awake) {
      awake = true;
      listeners.forEach((listen) => listen(true));
    }
  } catch {
    ctx = null;
  }
}

/** Tells a component when the first click has happened, so a prompt can go away. */
export function onPageSoundAwake(listen: (awake: boolean) => void) {
  listeners.add(listen);
  listen(awake);
  return () => void listeners.delete(listen);
}

/** Plays one page. Skips quietly if a fast scroll would turn it into a rattle. */
export function playPageSound(underVoice: boolean) {
  if (!ctx || !out || !clips.length || ctx.state !== "running") return;
  const now = performance.now();
  heard = heard.filter((at) => now - at < 1000);
  if (heard.length >= MAX_PER_SECOND || (heard.length && now - heard[heard.length - 1] < COOLDOWN_MS)) return;
  heard.push(now);
  let pick = Math.floor(Math.random() * clips.length);
  if (pick === last && clips.length > 1) pick = (pick + 1) % clips.length;
  last = pick;
  const source = ctx.createBufferSource();
  source.buffer = clips[pick];
  source.playbackRate.value = 1 + (Math.random() * 2 - 1) * RATE_SPREAD;
  const gain = ctx.createGain();
  gain.gain.value = underVoice ? LEVEL.underVoice : LEVEL.alone;
  source.connect(gain).connect(out);
  source.start();
}
