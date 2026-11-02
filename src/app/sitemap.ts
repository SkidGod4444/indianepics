import type { MetadataRoute } from "next";
import { chapters, events } from "@/lib/content";
import { abs, chapterPath, eventPath } from "@/lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: abs("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: abs("/reckoning/"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...chapters.map((c) => ({ url: abs(chapterPath(c.id)), lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...events.map((e) => ({ url: abs(eventPath(e.id)), lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
