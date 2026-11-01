import Link from "next/link";
import { MARK_COLS, MARK_ROWS, markDots } from "@/lib/logo";

/** The dot-matrix subcontinent, as an inline SVG. `size` is the height in px. */
export function Mark({ size = 22, className = "" }: { size?: number; className?: string }) {
  const rows = MARK_ROWS.length;
  const w = (MARK_COLS / rows) * size;
  return (
    <svg viewBox={`0 0 ${MARK_COLS} ${rows}`} width={w} height={size} className={className} aria-hidden>
      {markDots().map((d) => (
        <circle key={`${d.x}-${d.y}`} cx={d.x + 0.5} cy={d.y + 0.5} r={0.36} fill="currentColor" />
      ))}
    </svg>
  );
}

type Props = { href?: string; domain?: boolean; size?: "sm" | "lg"; className?: string };

/** Mark plus wordmark. `domain` appends .online, for the hero. */
export function Logo({ href = "/", domain = false, size = "sm", className = "" }: Props) {
  const lg = size === "lg";
  const inner = (
    <>
      <Mark size={lg ? 30 : 20} className="shrink-0 text-evidence" />
      <span className={`font-display tracking-tight text-ink ${lg ? "text-[26px]" : "text-[20px]"}`}>
        indian<span className="text-evidence">epics</span>
        {domain ? <span className="text-ink-3">.online</span> : null}
      </span>
    </>
  );
  const cls = `inline-flex items-center ${lg ? "gap-3" : "gap-2"} ${className}`;
  return href ? (
    <Link href={href} className={cls} aria-label="indianepics, home">
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}
