/** The mark: the subcontinent in a 9×10 dot grid. 1 = dot. Hand-placed so it reads at 16 px. */
export const MARK_ROWS = [
  "..###....",
  ".#####...",
  "#######..",
  ".########",
  ".#######.",
  "..#####..",
  "..####...",
  "...###...",
  "...##....",
  "....#....",
];
export const MARK_COLS = MARK_ROWS[0].length;

/** Dot centres on a unit grid, for SVG and for the icon. */
export function markDots() {
  const out: { x: number; y: number }[] = [];
  MARK_ROWS.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === "#") out.push({ x, y });
    });
  });
  return out;
}
