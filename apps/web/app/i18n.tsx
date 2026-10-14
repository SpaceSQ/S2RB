"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { S2RB_FREE_NOTICE, S2RB_FREE_NOTICE_EN } from "../src/config.ts";
import {
  COPY,
  DEFAULT_LOCALE,
  EN,
  LOCALE_STORAGE_KEY,
  type Locale,
} from "../src/site_copy.ts";

export type CopyKey = keyof typeof EN;

type LocaleApi = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  t: (key: CopyKey) => string;
  notice: string;
};

const LocaleContext = createContext<LocaleApi | null>(null);

function readQueryLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("lang");
  return raw === "zh" || raw === "en" ? raw : null;
}

function readStoredLocale(): Locale | null {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    return raw === "zh" || raw === "en" ? raw : null;
  } catch {
    return null;
  }
}

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  document.documentElement.dataset.locale = locale;
}

function persistLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* private mode */
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const fromQuery = readQueryLocale();
    const next = fromQuery ?? readStoredLocale() ?? DEFAULT_LOCALE;
    setLocaleState(next);
    persistLocale(next);
    applyDocumentLocale(next);
  }, []);

  const api = useMemo<LocaleApi>(() => {
    const setLocale = (next: Locale) => {
      setLocaleState(next);
      persistLocale(next);
      applyDocumentLocale(next);
    };
    return {
      locale,
      setLocale,
      t: (key) => COPY[locale][key] ?? COPY.en[key],
      notice: locale === "zh" ? S2RB_FREE_NOTICE : S2RB_FREE_NOTICE_EN,
    };
  }, [locale]);

  return <LocaleContext.Provider value={api}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleApi {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale requires LocaleProvider");
  return ctx;
}

export function usePageTitle(key: CopyKey) {
  const { t, locale } = useLocale();
  useEffect(() => {
    document.title = t(key);
  }, [t, locale, key]);
}

export function FreeNotice({ both = false }: { both?: boolean }) {
  const { locale } = useLocale();
  if (both) {
    return (
      <>
        <p className="notice">{S2RB_FREE_NOTICE_EN}</p>
        <p className="notice">{S2RB_FREE_NOTICE}</p>
      </>
    );
  }
  return <p className="notice">{locale === "zh" ? S2RB_FREE_NOTICE : S2RB_FREE_NOTICE_EN}</p>;
}
