import { Resolver } from "./resolver.tsx";
import { S2RB_FREE_NOTICE, TAOHUAYUAN_ROOT } from "../src/config.ts";

export default function HomePage() {
  return (
    <main>
      <h1>S2 Rainbow Bridge</h1>
      <p className="lead">全球地址域根网关。本地先筛 22 位 S2-DID 与门牌，脏数据不上云。未命中缓存的合法查询送往{TAOHUAYUAN_ROOT.title}。</p>
      <p className="lead">S2 不抢通用对话入口。腾讯 WorkBuddy、阿里 QoderWork 与通义把 S2 当成家里的物理接插件即可。合作说明在 <a href="/about">关于</a> 与 <a href="/api/v1/mcp">/api/v1/mcp</a>。</p>
      <p className="notice">{S2RB_FREE_NOTICE}</p>
      <Resolver />
    </main>
  );
}
