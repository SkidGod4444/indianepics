/** Pure helpers shared by server and client components. No "use client" here on purpose. */
export type Lang = "en" | "hi";

/** Pick `field_hi` when Hindi is on and the translation exists, else `field`. */
export function pick<T extends Record<string, unknown>>(obj: T, field: keyof T & string, lang: Lang): string {
  if (lang === "hi") {
    const hi = obj[`${field}_hi`];
    if (typeof hi === "string" && hi.length) return hi;
  }
  const v = obj[field];
  return typeof v === "string" ? v : "";
}

/** Class to switch the serif for Devanagari strings. */
export function langClass(lang: Lang) {
  return lang === "hi" ? "font-hi" : "font-display";
}
