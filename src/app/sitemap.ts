import type { MetadataRoute } from "next";
import { chapters, events, getImage, ledger } from "@/lib/content";
import { abs, absImage, chapterPath, eventPath } from "@/lib/seo";

export const dynamic = "force-static";

const pictures = (key: string | undefined) => {
  const image = getImage(key);
  return image ? [absImage(image)] : undefined;
};

/** No dates on the pages: the build has no record of when each one last changed, and a wrong date costs more than none. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: abs("/") },
    { url: abs("/reckoning/"), lastModified: ledger?.updated },
    ...chapters.map((c) => ({ url: abs(chapterPath(c.id)), images: pictures(c.image) })),
    ...events.map((e) => ({ url: abs(eventPath(e.id)), images: pictures(e.image) })),
  ];
}
