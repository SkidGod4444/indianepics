"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { Lang } from "./text";

type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const LangContext = createContext<Ctx>({ lang: "en", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    // Server-rendered text is printed in both languages, and the page shows one: see `.lang-en` in globals.css.
    document.documentElement.lang = next;
    document.documentElement.dataset.lang = next;
  }, []);
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
