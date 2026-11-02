"use client";

import { useEffect, useRef, useState } from "react";
import { VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoicePref } from "@/lib/narration";

type Props = {
  value: VoicePref;
  narrating: boolean;
  onChange: (v: VoicePref) => void;
  /** Whether a page makes its paper sound as it turns. */
  paper: boolean;
  onPaper: (on: boolean) => void;
};

/** The menu's size, to open it the way that stays on screen wherever the player has been put. */
const MENU = { width: 176, height: 190 };

/** A speaker. While `live`, its two waves light in turn from the cone outwards. Still, it is an ordinary speaker icon. */
function Speaker({ live }: { live: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={live ? "speaker-live" : undefined}>
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      <path className="wave" d="M16 9a5 5 0 0 1 0 6" />
      <path className="wave wave-far" d="M19.364 18.364a9 9 0 0 0 0-12.728" />
    </svg>
  );
}

const OPTIONS: { value: VoicePref; label: string; hint: string }[] = [
  { value: "en", label: "English", hint: "Narration in English" },
  { value: "hi", label: "हिन्दी", hint: "हिन्दी में कथन" },
  { value: "off", label: "Off", hint: "Timed scrolling, no voice" },
];

/** The narrator's switch: English, Hindi or off. A small menu above the play controls. */
export function VoiceMenu({ value, narrating, onChange, paper, onPaper }: Props) {
  const [open, setOpen] = useState(false);
  const [drop, setDrop] = useState({ below: false, fromLeft: false });
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", key);
    };
  }, [open]);
  const off = value === "off";
  return (
    <div ref={ref} className="relative">
      <Button
        size="icon-sm"
        variant="ghost"
        onClick={() => {
          const box = ref.current?.getBoundingClientRect();
          if (box) setDrop({ below: box.top < MENU.height + 16, fromLeft: box.right < MENU.width + 8 });
          setOpen((o) => !o);
        }}
        aria-label={off ? "Narration off. Choose a voice" : `Narration in ${value === "hi" ? "Hindi" : "English"}. Change`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Narration"
        className="relative rounded-full"
      >
        {off ? <VolumeX className="text-ink-3" /> : <Speaker live={narrating} />}
      </Button>
      {open ? (
        <div
          role="menu"
          aria-label="Narration"
          className={`absolute z-20 w-44 overflow-hidden rounded-lg border border-hair bg-paper/95 p-1 shadow-md ${drop.below ? "top-full mt-2" : "bottom-full mb-2"} ${drop.fromLeft ? "left-0" : "right-0"}`}
        >
          <p className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">Narration</p>
          {OPTIONS.map((o) => {
            const on = o.value === value;
            return (
              <button
                key={o.value}
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-paper-2 ${o.value === "hi" ? "font-hi" : ""} ${on ? "text-ink" : "text-ink-2"}`}
                title={o.hint}
              >
                <span>{o.label}</span>
                {on ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-evidence" /> : null}
              </button>
            );
          })}
          <div className="mx-1 my-1 border-t border-hair" />
          <button
            role="menuitemcheckbox"
            aria-checked={paper}
            onClick={() => onPaper(!paper)}
            className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-paper-2"
            title="The sound of a page turning"
          >
            <span>Paper sound</span>
            <span className="text-[11px] text-ink-3">{paper ? "On" : "Off"}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
