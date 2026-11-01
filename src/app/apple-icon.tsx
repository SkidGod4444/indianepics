import { ImageResponse } from "next/og";
import { MARK_COLS, MARK_ROWS, markDots } from "@/lib/logo";

export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const rows = MARK_ROWS.length;
  const cell = 140 / rows;
  const ox = (180 - MARK_COLS * cell) / 2;
  const oy = 20;
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: "#f4efe5", position: "relative", display: "flex" }}>
        {markDots().map((d) => (
          <div
            key={`${d.x}-${d.y}`}
            style={{
              position: "absolute",
              left: ox + d.x * cell + cell * 0.14,
              top: oy + d.y * cell + cell * 0.14,
              width: cell * 0.72,
              height: cell * 0.72,
              borderRadius: 999,
              background: "#c2561a",
            }}
          />
        ))}
      </div>
    ),
    size,
  );
}
