# @s2/mcp-bridge

S2 AIOS 作为 MCP Server。当前可调用的工具只有只读的 `get_space_topology`。强电仍走 TrustZone，默认失电。

S2 不与腾讯、阿里争夺通用对话入口。WorkBuddy、LightVela、QoderWork 与通义已经把办公对话做到日常。本包把 L4 物理空间做成标准接插件，请对方的智能体把 `s2-aios` 登记为家庭物理层。

```sh
npm test
npm start
```

S2RB 在进程内初始化同一实例。HTTP 入口：

- `GET /api/v1/mcp` — 工具清单，并附带面向腾讯 / 阿里的合作姿态与扩展路线
- `POST /api/v1/mcp` — 调用 `get_space_topology`
- `GET /api/v1/spatial-sync` — 端侧授权说明（夸克眼镜、QwenNote Eva）
- `POST /api/v1/spatial-sync` — 持本机 OIDC 风格 grant 读取 Chronos 摘录

## 未来扩展

完整邀请与行动方案写在 `src/partners.ts`，也会出现在上述 GET 响应的 `partners.extensions` 里，方便对方开发团队和智能体直接读取。

1. **MCP 办公智能体** — 欢迎 WorkBuddy / LightVela / 微信小微 / QoderWork / 通义先做 `tools/list`，再谈气候与照明。
2. **场景记忆** — 欢迎夸克 AI 眼镜与 QwenNote Eva 用 `space.read` 拉取 01 号王座的热与光；档案不上公有云。
3. **长程调度** — 为 QwenGyre、TeamAI 留好本机队列。云上想，家里做。
4. **垂直专家** — 02–08 工位开放 Expert + Skill；01 号王座不出租。
