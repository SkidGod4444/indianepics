import { Header } from "@/components/Header";
import { Stage } from "@/components/Stage";
import { SiteIndex } from "@/components/SiteIndex";
import { JsonLd, siteJsonLd } from "@/lib/seo";
import { chapters, events, polities } from "@/lib/content";

export default function Home() {
  return (
    <main className="relative">
      <Header />
      <JsonLd data={siteJsonLd(chapters)} />
      <Stage chapters={chapters} events={events} polities={polities} />
      <SiteIndex />
    </main>
  );
}
