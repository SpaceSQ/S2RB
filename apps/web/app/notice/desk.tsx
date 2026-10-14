"use client";

import { S2RB_REPO } from "../../src/config.ts";
import { HouseOsCard } from "../chrome.tsx";
import { FreeNotice, useLocale, usePageTitle } from "../i18n.tsx";

export function NoticeDesk() {
  const { t } = useLocale();
  usePageTitle("meta.notice");
  return (
    <main>
      <h1>{t("notice.title")}</h1>
      <p className="lead">{t("notice.lead")}</p>
      <FreeNotice both />
      <HouseOsCard />
      <section className="desk">
        <h2>{t("notice.useTitle")}</h2>
        <p className="lead">{t("notice.useBody")}</p>
        <h2>{t("notice.forbidTitle")}</h2>
        <p className="lead">{t("notice.forbidBody")}</p>
        <h2>{t("notice.licenseTitle")}</h2>
        <p className="lead">{t("notice.licenseBody")}</p>
        <h2>{t("notice.safetyTitle")}</h2>
        <p className="lead">{t("notice.safetyBody")}</p>
        <h2>{t("notice.patentTitle")}</h2>
        <p className="lead">{t("notice.patentBody")}</p>
        <p className="lead">{t("notice.contact")}</p>
        <p className="lead"><a href={S2RB_REPO}>{S2RB_REPO}</a></p>
      </section>
    </main>
  );
}
