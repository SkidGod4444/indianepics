import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Reckoning } from "@/components/Reckoning";
import { ledger } from "@/lib/content";
import { abs } from "@/lib/seo";

const description = "What the subcontinent held, what it lost and what arrived: output, famines, the drain debate, artefacts, languages and how the states were drawn, in the historians' own figures.";

export const metadata: Metadata = {
  title: "The reckoning",
  description,
  alternates: { canonical: abs("/reckoning/"), types: { "text/markdown": abs("/ledger.md") } },
  openGraph: { type: "article", title: "The reckoning", description, url: abs("/reckoning/") },
};

/** Printed in both languages, with no JavaScript for the text: `.lang-en` in globals.css shows the reader's one. */
export default function ReckoningPage() {
  if (!ledger) notFound();
  return (
    <main className="min-h-screen">
      <Header backed />
      <section className="ledger relative bg-paper px-5 pb-16 pt-20 lg:px-10">
        <div className="lang-en">
          <Reckoning record={ledger} lang="en" heading="h1" />
        </div>
        <div className="lang-hi" lang="hi">
          <Reckoning record={ledger} lang="hi" heading="h1" />
        </div>
      </section>
    </main>
  );
}
