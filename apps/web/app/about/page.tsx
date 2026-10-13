import { FUTURE_EXTENSIONS, ECOSYSTEM_STANCE, ECOSYSTEM_STANCE_EN } from "../../../packages/s2-mcp-bridge/src/partners.ts";
import { S2RB_FREE_NOTICE, S2RB_FREE_NOTICE_EN, S2RB_HOME, S2RB_REPO, S2RB_VERCEL, TAOHUAYUAN_ROOT } from "../../src/config.ts";

export default function AboutPage() {
  return (
    <main>
      <h1>关于 S2RB</h1>
      <p className="notice">{S2RB_FREE_NOTICE}</p>
      <p className="lead">{S2RB_FREE_NOTICE_EN}</p>
      <p className="lead">根节点 {TAOHUAYUAN_ROOT.title}（{TAOHUAYUAN_ROOT.locale}）。云端只记有效查询、成功握手身份和脱敏型号。</p>
      <p className="lead"><a href={S2RB_HOME}>{S2RB_HOME}</a></p>
      <p className="lead"><a href={S2RB_REPO}>{S2RB_REPO}</a></p>
      <p className="lead"><a href={S2RB_VERCEL}>{S2RB_VERCEL}</a></p>

      <h2>致腾讯、阿里及其智能体</h2>
      <p className="lead">{ECOSYSTEM_STANCE}</p>
      <p className="lead">{ECOSYSTEM_STANCE_EN}</p>
      {FUTURE_EXTENSIONS.map((lane) => (
        <section key={lane.id}>
          <h3>{lane.title}</h3>
          <p className="meta">预留 · {lane.hosts.join(" · ")}</p>
          <p className="lead">{lane.invitation}</p>
          <ul>
            {lane.actions.map((step) => (
              <li key={step} className="lead">{step}</li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
