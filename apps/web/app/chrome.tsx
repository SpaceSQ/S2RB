"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  S2AIOS_HOME,
  S2AIOS_REPO,
  S2RB_AUTHORITY,
  S2RB_HOME,
  S2RB_REPO,
  S2RB_SERIES,
} from "../src/config.ts";
import { PUBLIC_NAV } from "../src/site_copy.ts";
import { FreeNotice, LocaleProvider, useLocale, type CopyKey } from "./i18n.tsx";

export function SiteRoot({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <div className="shell">
        <SiteHeader />
        {children}
        <SiteFooter />
      </div>
    </LocaleProvider>
  );
}

function SiteHeader() {
  const { t, locale, setLocale } = useLocale();
  const path = usePathname() || "/";
  return (
    <header className="gate">
      <div className="mast">
        <div className="brand">
          <span className="stamp">{t("stamp.gate")}</span>
          <span className="stamp dim">{S2RB_SERIES}</span>
          <span className="stamp dim">{S2RB_AUTHORITY}</span>
        </div>
        <div className="lang-switch" role="group" aria-label={t("lang.label")}>
          <button type="button" className={locale === "en" ? "on" : ""} onClick={() => setLocale("en")}>
            {t("lang.en")}
          </button>
          <button type="button" className={locale === "zh" ? "on" : ""} onClick={() => setLocale("zh")}>
            {t("lang.zh")}
          </button>
        </div>
      </div>
      <nav>
        {PUBLIC_NAV.map((item) => (
          <a key={item.href} href={item.href} className={path === item.href ? "here" : undefined}>
            {t(item.key as CopyKey)}
          </a>
        ))}
      </nav>
    </header>
  );
}

/** Mid-page S2 AIOS window. Required on every public desk. */
export function HouseOsCard() {
  const { t } = useLocale();
  return (
    <section className="desk house-os" aria-label="S2 AIOS">
      <h2>{t("aios.midTitle")}</h2>
      <p className="lead">{t("aios.midBody")}</p>
      <p>
        <a className="house-os-link" href={S2AIOS_HOME}>
          {t("aios.midLink")}
        </a>
      </p>
    </section>
  );
}

function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="desk-foot">
      <FreeNotice />
      <p className="meta copyright">
        {t("footer.copyright")}
        {" · "}
        <a href={S2AIOS_REPO}>{t("footer.aios")}</a>
      </p>
      <p className="meta">
        {S2RB_SERIES} · {S2RB_AUTHORITY} · <a href={S2RB_HOME}>{S2RB_HOME}</a>
      </p>
      <p className="meta">
        <a href={S2RB_REPO}>{t("footer.repo")}</a>
        {" · "}
        <a href="/api/v1/mcp">{t("footer.mcp")}</a>
        {" · "}
        <a href="/api/v1/health">{t("footer.health")}</a>
      </p>
    </footer>
  );
}
