import { Header } from "@/components/Header";
import { Stage } from "@/components/Stage";
import { SiteIndex } from "@/components/SiteIndex";
import { JsonLd, siteJsonLd } from "@/lib/seo";
import { chapters, events, getImage, imageSrc, polities, prologue } from "@/lib/content";
import { eraFor } from "@/lib/eras";
import type { Plate } from "@/components/DotPlate";

export default function Home() {
  // The hero's plates: each chapter's picture, told in dots in that era's accent.
  const plates: Plate[] = chapters.flatMap((c) => {
    const img = getImage(c.image);
    const src = imageSrc(c.image);
    if (!img || !src) return [];
    const era = eraFor(c);
    return [{ id: c.id, src, title: img.title.replace(/\.[a-z]+$/i, ""), credit: /\.(jpe?g|png|tiff?)\b|_/i.test(img.author) ? img.license : `${img.author}, ${img.license}`, accent: c.track === "tradition" ? era.vars["--tradition"] : era.vars["--evidence"] }];
  });
  return (
    <main className="relative">
      <Header />
      <JsonLd data={siteJsonLd(chapters)} />
      <Stage chapters={chapters} events={events} polities={polities} prologue={prologue} plates={plates} />
      <SiteIndex />
    </main>
  );
}
