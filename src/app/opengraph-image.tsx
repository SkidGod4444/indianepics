import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-fonts";

export const dynamic = "force-static";
export const alt = "indianepics: a scroll-driven atlas of the Indian subcontinent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#f4efe5",
          color: "#1c1915",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28 }}>
          <span>
            indian<span style={{ color: "#c2561a" }}>epics</span>
          </span>
          <span style={{ fontSize: 20, color: "#8a8275", letterSpacing: 4 }}>A SCROLL-DRIVEN ATLAS</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Fraunces", fontSize: 92, lineHeight: 1, letterSpacing: -2 }}>From the Satya Yuga</div>
          <div style={{ fontFamily: "Fraunces", fontSize: 92, lineHeight: 1, letterSpacing: -2 }}>to this morning.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#57514a" }}>
          <span>Two tracks, tradition and evidence · English and Hindi</span>
          <span>9 chapters · 120 events · open data</span>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
