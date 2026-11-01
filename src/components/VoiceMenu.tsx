"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoicePref } from "@/lib/narration";

type Props = { value: VoicePref; narrating: boolean; onChange: (v: VoicePref) => void };

const OPTIONS: { value: VoicePref; label: string; hint: string }[] = [
  { value: "en", label: "English", hint: "Narration in English" },
  { value: "hi", label: "हिन्दी", hint: "हिन्दी में कथन" },
  { value: "off", label: "Off", hint: "Timed scrolling, no voice" },
];

/** The narrator's switch: English, Hindi or off. A small menu above the play controls. */
export function VoiceMenu({ value, narrating, onChange }: Props) {
  const [open, setOpen] = useState(false);
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
        onClick={() => setOpen((o) => !o)}
        aria-label={off ? "Narration off. Choose a voice" : `Narration in ${value === "hi" ? "Hindi" : "English"}. Change`}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Narration"
        className="relative rounded-full"
      >
        {off ? <VolumeX className="text-ink-3" /> : <Volume2 />}
        {narrating ? (
          <span aria-hidden className="absolute -right-0.5 -top-0.5 flex h-2.5 items-end gap-px">
            <i className="voice-bar" />
            <i className="voice-bar [animation-delay:120ms]" />
            <i className="voice-bar [animation-delay:240ms]" />
          </span>
        ) : null}
      </Button>
      {open ? (
        <div
          role="menu"
          aria-label="Narration"
          className="absolute bottom-full right-0 z-20 mb-2 w-44 overflow-hidden rounded-lg border border-hair bg-paper/95 p-1 shadow-md backdrop-blur-md"
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
        </div>
      ) : null}
    </div>
  );
}
