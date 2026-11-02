import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";

export const dynamic = "force-static";

/** Everyone is welcome, search engines and AI crawlers alike; llms.txt points agents at the Markdown. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: abs("/sitemap.xml"),
  };
}
