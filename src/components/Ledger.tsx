"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Ledger as LedgerRecord } from "@/content/schema";
import { useLang } from "@/lib/i18n";

const Reckoning = dynamic(() => import("./Reckoning").then((m) => m.Reckoning), { ssr: false });

/** How far ahead of the reader the reckoning starts loading. */
const AHEAD = "1600px 0px";

/**
 * The reckoning, as the last pages of the book. It is long, and most of a first visit never reaches it, so its figures
 * and code load as the reader comes near. The whole of it is also a page of its own at /reckoning/, for search engines
 * and for anyone who wants it directly.
 */
export function Ledger() {
  const { lang } = useLang();
  const hi = lang === "hi";
  const box = useRef<HTMLElement>(null);
  const [record, setRecord] = useState<LedgerRecord | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const watch = new IntersectionObserver(
      (seen) => {
        if (!seen.some((e) => e.isIntersecting)) return;
        watch.disconnect();
        fetch("/data/ledger.json")
          .then((r) => (r.ok ? (r.json() as Promise<LedgerRecord>) : Promise.reject(new Error("ledger"))))
          .then(setRecord)
          .catch(() => {});
      },
      { rootMargin: AHEAD },
    );
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  return (
    <section ref={box} id="ledger" aria-label="The reckoning" className="ledger far-section relative z-[2] bg-paper px-5 pb-16 pt-20 lg:px-10">
      {record ? (
        <Reckoning record={record} lang={lang} />
      ) : (
        <div className="relative mx-auto min-h-[60svh] max-w-[1100px]">
          <h2 className={`${hi ? "font-hi" : "font-display"} text-[clamp(2.4rem,5vw,4rem)] leading-none text-ink`}>{hi ? "हिसाब" : "The reckoning"}</h2>
          <Link href="/reckoning/" prefetch={false} className={`mt-4 inline-block text-[15px] text-ink-2 underline decoration-hair underline-offset-2 ${hi ? "font-hi" : ""}`}>
            {hi ? "पूरा पृष्ठ पढ़ें" : "Read the reckoning"}
          </Link>
        </div>
      )}
    </section>
  );
}
