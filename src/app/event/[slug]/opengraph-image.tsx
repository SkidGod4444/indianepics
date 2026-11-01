import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-fonts";
import { chapters, events, getEvent } from "@/lib/content";
import { eventDateLabel } from "@/lib/seo";

export const dynamic = "force-static";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return events.map((e) => ({ slug: e.id }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = getEvent(slug);
  const ch = ev ? chapters.find((c) => c.id === ev.chapter) : undefined;
  const accent = ev?.track === "tradition" ? "#2f416d" : "#c2561a";
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
          borderTop: `18px solid ${accent}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#8a8275" }}>
          <span>
            indian<span style={{ color: "#c2561a" }}>epics</span>
            {ch ? ` · ${ch.title}` : ""}
          </span>
          <span style={{ color: accent }}>{ev ? eventDateLabel(ev) : ""}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontFamily: "Fraunces", fontSize: ev && ev.title.length > 40 ? 64 : 80, lineHeight: 1.02, letterSpacing: -1.5 }}>{ev?.title ?? "indianepics"}</div>
          <div style={{ fontSize: 30, lineHeight: 1.3, color: "#57514a", maxWidth: 1000 }}>{ev?.summary ?? ""}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#57514a" }}>
          <span>{ev?.location.name ?? ""}</span>
          <span>{ev?.track === "tradition" ? "Tradition" : "Evidence"}</span>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
