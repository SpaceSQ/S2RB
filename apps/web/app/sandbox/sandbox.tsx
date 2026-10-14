"use client";

import { useMemo, useState } from "react";
import { AXIS_BANDS, RADAR_AXES, SAFE_RADAR, admitContact, type RadarAxis } from "../../src/red_anchor_sandbox.ts";
import { useLocale, type CopyKey } from "../i18n.tsx";

export function Sandbox() {
  const { t } = useLocale();
  const [radar, setRadar] = useState<Record<RadarAxis, number>>({ ...SAFE_RADAR } as Record<RadarAxis, number>);
  const [did, setDid] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [history, setHistory] = useState("");
  const [grants, setGrants] = useState("");
  const [complete, setComplete] = useState("{\"score\":80,\"connect\":\"DENY\",\"notes\":\"local\"}");
  const [audit, setAudit] = useState<unknown>(null);
  const verdict = useMemo(() => admitContact({ radar }), [radar]);

  return (
    <section>
      <div className="radar">
        {RADAR_AXES.map((axis) => (
          <label key={axis}>
            {t(`axis.${axis}` as CopyKey)} {AXIS_BANDS[axis].unit}
            <input
              type="number"
              step="0.1"
              value={radar[axis]}
              onChange={(event) => setRadar((current) => ({ ...current, [axis]: Number(event.target.value) }))}
            />
          </label>
        ))}
      </div>
      <pre className={verdict.ok ? "ok" : "veto"}>{JSON.stringify(verdict, null, 2)}</pre>

      <h2>{t("sandbox.auditTitle")}</h2>
      <p className="lead">{t("sandbox.auditLead")}</p>
      <label>
        {t("sandbox.did")}
        <input value={did} onChange={(event) => setDid(event.target.value)} />
      </label>
      <label>
        {t("sandbox.publicKey")}
        <input value={publicKey} onChange={(event) => setPublicKey(event.target.value)} />
      </label>
      <label>
        {t("sandbox.history")}
        <input value={history} onChange={(event) => setHistory(event.target.value)} />
      </label>
      <label>
        {t("sandbox.grants")}
        <input value={grants} onChange={(event) => setGrants(event.target.value)} />
      </label>
      <label>
        {t("sandbox.complete")}
        <textarea rows={4} value={complete} onChange={(event) => setComplete(event.target.value)} />
      </label>
      <button
        type="button"
        onClick={async () => {
          const res = await fetch("/api/v1/audit", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ did, publicKey, history, grants, complete }),
          });
          setAudit(await res.json());
        }}
      >
        {t("sandbox.audit")}
      </button>
      {audit ? <pre className={typeof audit === "object" && audit && "ok" in audit && audit.ok ? "ok" : "veto"}>{JSON.stringify(audit, null, 2)}</pre> : null}
    </section>
  );
}
