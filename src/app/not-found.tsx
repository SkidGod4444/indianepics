import Link from "next/link";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-6">
      <Header backed />
      <div className="max-w-[46ch] text-center">
        <p className="text-[12px] uppercase tracking-[0.2em] text-ink-3">404</p>
        <h1 className="font-display mt-3 text-[clamp(2rem,5vw,3.2rem)] leading-tight text-ink">This page is not in the book.</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">The link may be old, or the page may have moved.</p>
        <Link href="/" className="mt-6 inline-block text-[15px] text-ink underline decoration-hair underline-offset-4">
          Back to the first page
        </Link>
      </div>
    </main>
  );
}
