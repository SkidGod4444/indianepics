import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Reckoning } from "@/components/Reckoning";
import { ledger } from "@/lib/content";
import { JsonLd, SITE_NAME, abs, breadcrumbJsonLd, cardUrl, reckoningJsonLd, shareTags } from "@/lib/seo";

const description =
  "What the subcontinent held, what it lost and what arrived: output, famines, the drain debate, artefacts and languages, in the historians' own figures.";

export const metadata: Metadata = {
  title: "The reckoning",
  description,
  alternates: { canonical: abs("/reckoning/"), types: { "text/markdown": abs("/ledger.md") } },
  ...shareTags({
    title: "The reckoning",
    description,
    path: "/reckoning/",
    image: cardUrl("reckoning"),
    alt: "The reckoning: an open ledger page charting India's share of the world's output from 1 CE to 2008",
    article: { section: "The last pages" },
  }),
};

/** Printed in both languages, with no JavaScript for the text: `.lang-en` in globals.css shows the reader's one. */
export default function ReckoningPage() {
  if (!ledger) notFound();
  return (
    <main className="min-h-screen">
      <Header backed />
      <JsonLd data={reckoningJsonLd(ledger.updated, description)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: SITE_NAME, path: "/" },
          { name: "The reckoning", path: "/reckoning/" },
        ])}
      />
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
