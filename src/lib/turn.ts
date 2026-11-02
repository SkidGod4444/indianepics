/** A page lands flat at this share of the turn. The rest fades a blank back into the page beneath it. */
/** Share of a slot of scrolling that turns the page. The rest of the slot rests on it. */
export const TURN_SHARE = 0.34;
/** How long a page takes to turn while the story plays. */
export const TURN_MS = 1300;

export const LAND = 0.8;

export const clampUnit = (t: number) => Math.min(1, Math.max(0, t));
export const smooth = (t: number) => t * t * (3 - 2 * t);

/** How far round a page has come, 0 at rest on the right to `sweep` degrees. */
export const leafAngle = (t: number, sweep = 180) => -sweep * smooth(Math.min(1, t / LAND));

/** Strips a turning sheet is cut into. Each is a layer, and a phone's small sheet bends well enough on six. */
export const STRIPS = { wide: 12, phone: 6 };
/** A phone's page has nowhere to land, so it swings off the left edge. */
export const PHONE_SWEEP = 130;
/** A page's sound plays as it lifts, in either direction. */
export const crossedTurn = (was: number, now: number) => (was < 0.08 && now >= 0.08) || (was > 0.92 && now <= 0.92);
