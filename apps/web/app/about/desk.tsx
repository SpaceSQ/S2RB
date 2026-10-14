"use client";

import { ECOSYSTEM_STANCE, ECOSYSTEM_STANCE_EN, FUTURE_EXTENSIONS } from "../../../../packages/mcp/src/partners.ts";
import { EXT_EN } from "../../src/site_copy.ts";
import { S2RB_HOME, S2RB_REPO, S2RB_VERCEL } from "../../src/config.ts";
import { HouseOsCard } from "../chrome.tsx";
import { FreeNotice, useLocale, usePageTitle } from "../i18n.tsx";

export function AboutDesk() {
  const { t, locale } = useLocale();
  usePageTitle("meta.about");
  return (
    <main>
      <h1>{t("about.title")}</h1>
      <FreeNotice />
      <p className="lead">{t("about.lead")}</p>
      <p className="lead">{t("about.root")}</p>
      <p className="lead"><a href={S2RB_HOME}>{S2RB_HOME}</a></p>
      <p className="lead"><a href={S2RB_REPO}>{S2RB_REPO}</a></p>
      <p className="lead"><a href={S2RB_VERCEL}>{S2RB_VERCEL}</a></p>
      <HouseOsCard />
      <h2>{t("about.partners")}</h2>
      <p className="lead">{locale === "zh" ? ECOSYSTEM_STANCE : ECOSYSTEM_STANCE_EN}</p>
      {FUTURE_EXTENSIONS.map((lane) => {
        const en = EXT_EN[lane.id];
        const title = locale === "zh" ? lane.title : en?.title ?? lane.title;
        const invitation = locale === "zh" ? lane.invitation : en?.invitation ?? lane.invitation;
        const actions = locale === "zh" ? lane.actions : en?.actions ?? lane.actions;
        return (
          <section key={lane.id} className="desk">
            <h3>{title}</h3>
            <p className="meta">
              {lane.status === "WIRED" ? t("about.wired") : t("about.reserved")}
              {" · "}
              {lane.module}
              {" · "}
              {lane.hosts.join(" · ")}
            </p>
            <p className="lead">{invitation}</p>
            <ul>
              {actions.map((step) => (
                <li key={step} className="lead">{step}</li>
              ))}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
