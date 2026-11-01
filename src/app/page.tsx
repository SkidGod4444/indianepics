import { Header } from "@/components/Header";
import { Stage } from "@/components/Stage";
import { Intro } from "@/components/Intro";
import { chapters, events, polities } from "@/lib/content";

export default function Home() {
  return (
    <main className="relative">
      <Header />
      <Intro chapterCount={chapters.length} eventCount={events.length} />
      <Stage chapters={chapters} events={events} polities={polities} />
    </main>
  );
}
