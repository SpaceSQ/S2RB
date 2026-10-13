"use client";

import { useMemo, useState } from "react";
import { admitContact } from "../../src/red_anchor_sandbox.ts";

export function Sandbox() {
  const [tactile, setTactile] = useState(1);
  const [oxygen, setOxygen] = useState(21);
  const verdict = useMemo(
    () => admitContact({ radar: { tactile, base_air: oxygen } }),
    [tactile, oxygen],
  );
  return (
    <section>
      <div className="grid">
        <label>
          触觉 N
          <input type="number" step="0.1" value={tactile} onChange={(event) => setTactile(Number(event.target.value))} />
        </label>
        <label>
          氧浓度 %
          <input type="number" step="0.1" value={oxygen} onChange={(event) => setOxygen(Number(event.target.value))} />
        </label>
      </div>
      <pre className={verdict.ok ? "ok" : "veto"}>{JSON.stringify(verdict, null, 2)}</pre>
    </section>
  );
}
