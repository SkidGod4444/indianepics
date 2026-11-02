"use client";

import { useLang } from "@/lib/i18n";
import { Logo } from "./Logo";
import { type Lang } from "@/lib/text";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** `backed` is for pages whose text scrolls under the header: it fades that text out behind the logo and the toggles. */
export function Header({ backed = false }: { backed?: boolean }) {
  const { lang, setLang } = useLang();
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-3 lg:px-6">
      {backed ? <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[68px] bg-gradient-to-b from-paper from-70% to-transparent" /> : null}
      <Logo className="pointer-events-auto" />
      <div className="pointer-events-auto flex items-center gap-2">
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          spacing={0}
          value={lang}
          onValueChange={(v) => v && setLang(v as Lang)}
          aria-label="Language"
          className="bg-paper/95"
        >
          <ToggleGroupItem value="en" aria-label="English" className="text-[12px] data-[state=on]:bg-ink data-[state=on]:text-paper">
            EN
          </ToggleGroupItem>
          <ToggleGroupItem value="hi" aria-label="Hindi" className="font-hi pt-0.5 text-[12px] data-[state=on]:bg-ink data-[state=on]:text-paper">
            हिं
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </header>
  );
}
