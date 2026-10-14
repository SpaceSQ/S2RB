"use client";

import { S2RB_REPO } from "../../src/config.ts";
import { HouseOsCard } from "../chrome.tsx";
import { FreeNotice, useLocale, usePageTitle } from "../i18n.tsx";

export function HostDesk() {
  const { t } = useLocale();
  usePageTitle("meta.host");
  return (
    <main>
      <h1>{t("host.title")}</h1>
      <p className="lead">{t("host.lead")}</p>
      <FreeNotice />
      <HouseOsCard />
      <p className="lead">{t("host.notAios")}</p>
      <section className="desk">
        <h2>{t("host.portsTitle")}</h2>
        <p className="lead">{t("host.portsBody")}</p>
      </section>
      <section className="desk">
        <h2>{t("host.piTitle")}</h2>
        <p className="lead">{t("host.piBody")}</p>
        <pre>{`git clone ${S2RB_REPO}.git
cd S2RB/apps/host
sudo ./install-pi.sh`}</pre>
      </section>
      <section className="desk">
        <h2>{t("host.opiTitle")}</h2>
        <p className="lead">{t("host.opiBody")}</p>
        <pre>{`git clone ${S2RB_REPO}.git
cd S2RB/apps/host
sudo ./install-opi.sh`}</pre>
      </section>
      <section className="desk">
        <h2>{t("host.composeTitle")}</h2>
        <p className="lead">{t("host.composeBody")}</p>
        <pre>{`cd apps/host
docker compose up -d`}</pre>
      </section>
      <section>
        <h2>{t("host.envTitle")}</h2>
        <p className="lead">{t("host.envBody")}</p>
        <h2>{t("host.afterTitle")}</h2>
        <p className="lead">{t("host.afterBody")}</p>
        <p className="notice">{t("host.safety")}</p>
      </section>
    </main>
  );
}
