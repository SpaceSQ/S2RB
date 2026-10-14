"use client";

import { HouseOsCard } from "../chrome.tsx";
import { FreeNotice, useLocale, usePageTitle } from "../i18n.tsx";
import { Sandbox } from "./sandbox.tsx";

export function SandboxDesk() {
  const { t } = useLocale();
  usePageTitle("meta.sandbox");
  return (
    <main>
      <h1>{t("sandbox.title")}</h1>
      <p className="lead">{t("sandbox.lead")}</p>
      <FreeNotice />
      <HouseOsCard />
      <Sandbox />
    </main>
  );
}
