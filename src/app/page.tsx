import { Header } from "@/components/Header";
import { Stage } from "@/components/Stage";
import { chapters, events, polities } from "@/lib/content";

export default function Home() {
  return (
    <main className="relative">
      <Header />
      <Stage chapters={chapters} events={events} polities={polities} />
    </main>
  );
}
