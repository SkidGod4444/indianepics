"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import type { EpicEvent } from "@/content/schema";
import { getImage, imageSrc } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { pick, langClass } from "@/lib/text";
import { glyphFor } from "@/lib/timeline";
import { Button } from "@/components/ui/button";
import { EventBody } from "./EventBody";
import { DotGlyph } from "./DotGlyph";

/**
 * The detail "page", opened in place. The card grows into it (shared layoutId),
 * the URL becomes /event/<id>/ via pushState, and Back closes it. No reload.
 */
export function DetailOverlay({ ev, onClose }: { ev: EpicEvent; onClose: () => void }) {
  const { lang } = useLang();
  const img = getImage(ev.image);
  const tradition = ev.track === "tradition";

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/30 px-0 py-0 backdrop-blur-sm sm:px-6 sm:py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      onClick={onClose}
    >
      <motion.article
        layoutId={`card-${ev.id}`}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="relative w-full max-w-[760px] overflow-hidden bg-paper text-ink shadow-[0_40px_120px_-40px_rgba(0,0,0,0.6)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-hair bg-paper/90 px-5 py-3 backdrop-blur-sm sm:px-8">
          <span className={`flex items-center gap-2 text-[12px] ${tradition ? "text-tradition" : "text-evidence"}`}>
            <DotGlyph name={glyphFor(ev)} size={22} />
            {tradition ? "Tradition" : "Evidence"} · {ev.location.name}
          </span>
          <Button size="icon-sm" variant="ghost" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>
        {img ? (
          <figure>
            <motion.img
              layoutId={`img-${ev.id}`}
              src={imageSrc(img.key)}
              alt={img.title}
              className="aspect-[16/9] w-full object-cover"
            />
            <figcaption className="px-5 pt-2 text-[11px] leading-tight text-ink-3 sm:px-8">
              {img.title}. {img.author},{" "}
              {img.licenseUrl ? (
                <a href={img.licenseUrl} className="underline decoration-hair underline-offset-2 hover:text-ink-2" target="_blank" rel="noreferrer">
                  {img.license}
                </a>
              ) : (
                img.license
              )}
              , via{" "}
              <a href={img.source} className="underline decoration-hair underline-offset-2 hover:text-ink-2" target="_blank" rel="noreferrer">
                Wikimedia Commons
              </a>
              .
            </figcaption>
          </figure>
        ) : null}
        <div className="px-5 pb-12 pt-6 sm:px-8">
          <motion.h1 layoutId={`title-${ev.id}`} className={`${langClass(lang)} mb-6 text-[clamp(1.9rem,4vw,2.8rem)] leading-[1.05] text-ink`}>
            {pick(ev, "title", lang)}
          </motion.h1>
          <EventBody ev={ev} lang={lang} showTitle={false} showImage={false} />
        </div>
      </motion.article>
    </motion.div>
  );
}
