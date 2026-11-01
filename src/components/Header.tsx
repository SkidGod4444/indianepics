"use client";

import { GitPullRequestArrow } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Logo } from "./Logo";
import { type Lang } from "@/lib/text";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function Header() {
  const { lang, setLang } = useLang();
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-3 lg:px-6">
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
          className="bg-paper/85 backdrop-blur-sm"
        >
          <ToggleGroupItem value="en" aria-label="English" className="text-[12px] data-[state=on]:bg-ink data-[state=on]:text-paper">
            EN
          </ToggleGroupItem>
          <ToggleGroupItem value="hi" aria-label="Hindi" className="font-hi pt-0.5 text-[12px] data-[state=on]:bg-ink data-[state=on]:text-paper">
            हिं
          </ToggleGroupItem>
        </ToggleGroup>
        <Button asChild variant="outline" size="sm" className="bg-paper/85 backdrop-blur-sm">
          <a href="https://github.com/SkidGod4444/indianepics" target="_blank" rel="noreferrer">
            <GitPullRequestArrow data-icon="inline-start" />
            Contribute
          </a>
        </Button>
      </div>
    </header>
  );
}
