import { preload } from "react-dom";
import { Header } from "@/components/Header";
import { Stage } from "@/components/Stage";
import { Ledger } from "@/components/Ledger";
import { SiteIndex } from "@/components/SiteIndex";
import { JsonLd, siteJsonLd } from "@/lib/seo";
import { bookChapters, bookEvents, chapters, polities, prologue } from "@/lib/content";

export default function Home() {
  // The hero's sketch starts arriving with the page, so it begins drawing the moment the code runs.
  preload("/sketch/hero.txt", { as: "fetch", crossOrigin: "anonymous" });
  return (
    <main className="relative">
      <Header />
      <JsonLd data={siteJsonLd(chapters)} />
      <Stage chapters={bookChapters()} events={bookEvents()} polities={polities} prologue={prologue} />
      <Ledger />
      <SiteIndex />
    </main>
  );
}
