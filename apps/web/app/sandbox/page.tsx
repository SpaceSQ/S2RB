import { Sandbox } from "./sandbox.tsx";
import { OXYGEN_PERCENT_MIN, TACTILE_NEWTON_MAX } from "../../src/red_anchor_sandbox.ts";

export default function SandboxPage() {
  return (
    <main>
      <h1>红锚哨兵</h1>
      <p className="lead">14 维雷达在建联前熔断。触觉超过 {TACTILE_NEWTON_MAX} N，或氧浓度低于 {OXYGEN_PERCENT_MIN}%，本地打上 [VETO_SECURITY]。拓扑不上云，市电保持切断。</p>
      <Sandbox />
    </main>
  );
}
