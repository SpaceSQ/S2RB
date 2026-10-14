"use client";

import { useState } from "react";
import { allowCloudFetch } from "../src/s2rb_dns_root.ts";
import { isReviewer, openReviewerSession } from "../src/reviewer.ts";
import { useLocale } from "./i18n.tsx";

export function Resolver() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  async function resolve() {
    const gate = allowCloudFetch(query);
    if (!gate.ok) {
      setOut(JSON.stringify({ ok: false, code: "LOCAL_REJECT", upload: false, sent: false }, null, 2));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/v1/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: gate.clean }),
      });
      setOut(JSON.stringify(await res.json(), null, 2));
    } finally {
      setBusy(false);
    }
  }

  const review = isReviewer(email) ? openReviewerSession(email) : null;

  return (
    <section>
      <label htmlFor="query">{t("resolver.query")}</label>
      <input
        id="query"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("resolver.queryHint")}
        autoCapitalize="characters"
        spellCheck={false}
      />
      <button type="button" onClick={resolve} disabled={busy}>
        {t("resolver.submit")}
      </button>
      {out ? <pre className={out.includes("\"ok\": true") ? "ok" : "veto"}>{out}</pre> : null}

      <label htmlFor="email">{t("resolver.email")}</label>
      <input
        id="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={t("resolver.emailHint")}
        autoComplete="username"
      />
      {review?.ok ? (
        <pre className="ok">{JSON.stringify({ lan: review.lan, fleet: review.fleet }, null, 2)}</pre>
      ) : null}
    </section>
  );
}
