"use client";

import { S2AIOS_HOME, S2RB_REPO, SITE_EXAMPLE } from "../src/config.ts";
import { HouseOsCard } from "./chrome.tsx";
import { FreeNotice, useLocale, usePageTitle } from "./i18n.tsx";
import { Resolver } from "./resolver.tsx";

export function HomeDesk() {
  const { t } = useLocale();
  usePageTitle("meta.home");
  return (
    <main>
      <p className="kicker">{t("home.kicker")}</p>
      <h1>{t("home.title")}</h1>
      <p className="lead">{t("home.lead")}</p>
      <FreeNotice />
      <HouseOsCard />
      <section className="desk">
        <h2>{t("home.vsTitle")}</h2>
        <div className="pair">
          <div>
            <h3>{t("home.vsS2rb")}</h3>
            <p className="lead">{t("home.vsS2rbBody")}</p>
          </div>
          <div>
            <h3>
              <a href={S2AIOS_HOME}>{t("home.vsAios")}</a>
            </h3>
            <p className="lead">{t("home.vsAiosBody")}</p>
          </div>
        </div>
      </section>
      <section>
        <h2>{t("home.rootTitle")}</h2>
        <p className="lead">{t("home.rootBody")}</p>
      </section>
      <section className="desk">
        <h2>{t("home.deskTitle")}</h2>
        <p className="lead">{t("home.gateHint")}</p>
        <p className="meta">{SITE_EXAMPLE}</p>
        <Resolver />
      </section>
      <section>
        <h2>{t("home.linksTitle")}</h2>
        <ul className="windows">
          <li><a href="/sandbox">{t("home.linkSandbox")}</a></li>
          <li><a href="/about">{t("home.linkAbout")}</a></li>
          <li><a href="/host">{t("home.linkHost")}</a></li>
          <li><a href="/notice">{t("home.linkNotice")}</a></li>
          <li><a href="/api/v1/mcp">{t("home.linkMcp")}</a></li>
          <li><a href="/api/v1/health">{t("home.linkHealth")}</a></li>
          <li><a href={S2RB_REPO}>{t("home.linkRepo")}</a></li>
          <li><a href={S2AIOS_HOME}>{t("aios.midLink")}</a></li>
        </ul>
      </section>
    </main>
  );
}
