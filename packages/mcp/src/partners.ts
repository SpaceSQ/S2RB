export type ExtensionStatus = "PREPARED";

export type FutureExtension = {
  id: string;
  status: ExtensionStatus;
  module: "MCP" | "SPATIAL" | "HORIZON" | "VERTICAL";
  title: string;
  hosts: readonly string[];
  invitation: string;
  actions: readonly string[];
};

export const ECOSYSTEM_STANCE =
  "S2 AIOS 不与腾讯、阿里争夺通用对话入口。混元与微信上的 WorkBuddy、LightVela，以及通义与 QoderWork 已经把办公对话做到了日常。我们把 L4 物理空间的只读态势和受 TrustZone 约束的致动，封装成标准 MCP 服务与授权档案流，请对方的智能体把 S2 当成家里的物理接插件，而不是又一个聊天窗口。";

export const ECOSYSTEM_STANCE_EN =
  "S2 AIOS does not contest the general chat doorway. Tencent WorkBuddy / LightVela and Alibaba QoderWork / Qwen already own daily conversation. S2 offers L4 spatial state and TrustZone-gated actuation as a standard MCP plug. Treat this host as the house's physical adapter.";

export const FUTURE_EXTENSIONS: readonly FutureExtension[] = [
  {
    id: "mcp-office-agents",
    status: "PREPARED",
    module: "MCP",
    title: "办公智能体经彩虹桥调用空间",
    hosts: ["腾讯 WorkBuddy", "腾讯 LightVela", "微信小微", "阿里 QoderWork", "阿里通义 / Qwen Intelligence"],
    invitation:
      "欢迎腾讯与阿里的办公智能体把 S2 登记为官方 MCP Server。用户在微信或通义里说「把实验室调低一度」时，请先调用 get_space_topology 确认门牌与 01 号王座，再走后续受权致动。S2 尊重你们的会话与账号体系，不复制聊天记录，也不另开一套通用助手。",
    actions: [
      "用 stdio 或 HTTPS /api/v1/mcp 做一次 tools/list，确认 get_space_topology 为只读。",
      "在 WorkBuddy / QoderWork 的工具目录里把 s2-aios 标为「家庭物理层」，而不是「又一个 LLM」。",
      "致动类工具保持预留：任何强电都必须经过本机 TrustZone，默认失电。S2 乐于和混元、通义一起做这条安全回执。",
      "联调窗口对腾讯与阿里开发者团队开放：先读拓扑，再谈气候与照明，最后才谈写权限。",
    ],
  },
  {
    id: "spatial-wearable-sync",
    status: "PREPARED",
    module: "SPATIAL",
    title: "端侧硬件拉取场景记忆",
    hosts: ["夸克 AI 眼镜", "阿里 QwenNote Eva", "通义桌面机器人", "微信生态随身设备"],
    invitation:
      "巨头正在用眼镜、耳机和桌面机器人收集场景记忆。S2 已经住在房间里，愿意把 Chronos 档案（taohuayuan.md）按 OIDC 风格授权，安全地借给夸克 AI 眼镜、QwenNote Eva 以及微信生态随身设备。硬件感知层归你们，空间主权层归 01 号王座。两边合在一起，才是完整的现场。",
    actions: [
      "端侧先向本机申请 audience=s2-spatial-sync、scope=space.read 的短期 grant，再 POST /api/v1/spatial-sync。",
      "摘录默认不超过 1000 字，且 upload=false。S2 不把家庭温度、光照和门牌整包送进公有云。",
      "邀请夸克眼镜与 QwenNote Eva 的团队把「当前 01 号王座的热与光」做成只读卡片，文案里写明数据来自用户自己的 S2 Host。",
      "拒绝无授权探测。友好不等于敞开；友好是把合法通道写清楚，并优先回复你们的联调邮件。",
    ],
  },
  {
    id: "horizon-schedulers",
    status: "PREPARED",
    module: "HORIZON",
    title: "长程调度框架接入本机队列",
    hosts: ["阿里 QwenGyre", "腾讯 TeamAI"],
    invitation:
      "超长程智能体需要在无人值守时连续工作数小时。S2 已在主机里留好挂起、本地回调和轨迹压缩。QwenGyre 与 TeamAI 不必改写房间网格，只需把任务轨迹交给本机队列，由 01 号王座看着熔断与失电。我们视这两套框架为专业调度伙伴，而不是竞品。",
    actions: [
      "先对接只读轨迹：把能耗监测、巡检这类 12 小时任务写成 HorizonJob，回调留在 LOCAL。",
      "重复读数按摘要继承，步数触顶熔断，避免长任务撑爆边缘内存。这是给工业级调度的见面礼。",
      "QwenGyre / TeamAI 的适配器状态为 PREPARED。正式接线时，S2 提供任务 ID、挂起点和 TrustZone 否决回执，不索要你们的训练数据。",
      "欢迎把 S2 标成「空间执行面」：语言模型在云上想，物理闭环在家里做。",
    ],
  },
  {
    id: "vertical-expert-hub",
    status: "PREPARED",
    module: "VERTICAL",
    title: "专家技能坐进 02–08 工位",
    hosts: ["腾讯 WorkBuddy Expert + Skill", "阿里垂直智能体与通义插件"],
    invitation:
      "通用大模型难以下沉的康养、实验室和极客私有云，正是 S2 愿意让位给生态伙伴的地方。工位 02–08 开放给第三方 Expert + Skill；01 号王座不出租。腾讯已经验证过专家加技能的组合，阿里也在垂直行业铺开智能体。S2 用同一套语言欢迎两边把算法装进房间，并与指定 L4 绑定。",
    actions: [
      "插件只进沙箱：禁止网络、文件系统和子进程；Wasm 运行时标记 PREPARED，随你们的打包节奏启用。",
      "技能与门牌绑定，不随微信或通义账号漂到别人家里。",
      "分发走彩虹桥本地目录，个人免费使用。S2 不另建收费应用商店来分流你们的开发者。",
      "跌倒监测、工业温控这类专家包，欢迎以独立 Skill 形式联调；强电仍须 01 号点头。",
    ],
  },
];

export function partnerManifest() {
  return {
    stance: ECOSYSTEM_STANCE,
    stance_en: ECOSYSTEM_STANCE_EN,
    posture: "ACTIVE_FRIENDLY_PARTNER" as const,
    contest_chat_door: false,
    extensions: FUTURE_EXTENSIONS,
  };
}
