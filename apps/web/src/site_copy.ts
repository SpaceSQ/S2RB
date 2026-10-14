export type Locale = "en" | "zh";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "s2rb-locale";

export const PUBLIC_NAV = [
  { href: "/", key: "nav.resolve" },
  { href: "/sandbox", key: "nav.sandbox" },
  { href: "/host", key: "nav.host" },
  { href: "/about", key: "nav.about" },
  { href: "/notice", key: "nav.notice" },
] as const;

export const EN = {
  "meta.home": "S2 Rainbow Bridge · S2-NF-001",
  "meta.sandbox": "Red Anchor · S2RB",
  "meta.about": "About · S2RB",
  "meta.host": "Host · S2RB",
  "meta.notice": "Notice · S2RB",
  "nav.resolve": "Resolve",
  "nav.sandbox": "Red Anchor",
  "nav.host": "Host",
  "nav.about": "About",
  "nav.notice": "Notice",
  "nav.github": "GitHub",
  "stamp.gate": "S2RB GATE",
  "lang.label": "Language",
  "lang.en": "EN",
  "lang.zh": "中文",
  "footer.copyright": "Copyright (c) 2026 Miles Xiang & RobotZero team",
  "footer.aios": "S2 AIOS",
  "footer.mcp": "MCP",
  "footer.health": "Health",
  "footer.repo": "Repository",
  "aios.midTitle": "S2 AIOS — the house OS",
  "aios.midBody":
    "S2RB does not replace S2 AIOS. A house still needs that spatial operating system for the plate, throne 01, 14-axis radar, taohuayuan.md, and TrustZone. S2RB is only the visitor gateway.",
  "aios.midLink": "Open S2 AIOS",
  "home.title": "S2 Rainbow Bridge",
  "home.kicker": "Federation customs · carbon–silicon universe",
  "home.lead":
    "Supreme customs of this universe. The browser screens 22-character S2-DIDs and doorplates first. Dirty tokens return LOCAL_REJECT and never call fetch(). Franchise plates go to the Taohuayuan root in Changde after a cache miss. With no root URL or zone file the answer is NO_ROOT — never a fake hit.",
  "home.vsTitle": "S2RB is not S2 AIOS",
  "home.vsS2rb": "S2RB",
  "home.vsAios": "S2 AIOS",
  "home.vsS2rbBody":
    "Independent federation gateway and visitor client. Screens DID and plate, talks to Taohuayuan, stamps a Red Anchor visa, keeps an MQTT mailbox, and offers a read-only MCP plug. Port 3100. Never energizes mains. Not a chat door.",
  "home.vsAiosBody":
    "Spatial OS for one room. Owns the plate, throne 01, 14-axis radar, taohuayuan.md, and TrustZone. Ports 1883 / 1884 / 8787. A house still needs that host. S2RB only visits.",
  "home.rootTitle": "Taohuayuan lanes",
  "home.rootBody":
    "Order is cache → local SITE → Changde zone or HTTP. Hits and misses cache with a TTL. Cloud rows are valid lookups, successful handshakes, and a redacted model only. There is no second WEIGHTS table. If this deploy has no S2_TAOHUAYUAN_URL and no zone, franchise queries return NO_ROOT.",
  "home.deskTitle": "Customs desk",
  "home.gateHint":
    "Dirty DID or plate stays in this tab (upload: false, sent: false). SITE resolves on LOCAL. A franchise plate without a root is NO_ROOT.",
  "home.linksTitle": "Public windows",
  "home.linkSandbox": "Red Anchor · 14-axis sentry",
  "home.linkAbout": "Partners · four WIRED extensions",
  "home.linkHost": "Host · Raspberry Pi / Orange Pi",
  "home.linkNotice": "Notice · personal use only",
  "home.linkMcp": "MCP manifest",
  "home.linkHealth": "Health (mains deenergized)",
  "home.linkRepo": "GitHub SpaceSQ/S2RB",
  "resolver.query": "S2-DID or plate",
  "resolver.queryHint": "22-character DID, or SITE-… / MARS-…",
  "resolver.submit": "Screen locally, then resolve",
  "resolver.email": "Reviewer email (optional)",
  "resolver.emailHint": "apple@robot0.com",
  "sandbox.title": "Red Anchor sentry",
  "sandbox.lead":
    "Fourteen radar axes fuse on the visa before a handshake. Tactile above 5 N, oxygen below 19.5%, or any other axis out of band stamps [VETO_SECURITY] here. Model audit uses only the caller-supplied complete payload or the caller's own S2_AUDIT_COMPLETE_URL. No API key lives in this repository. Topology does not go to the cloud. Mains stay cut.",
  "sandbox.auditTitle": "Agent model callback",
  "sandbox.auditLead":
    "Paste complete JSON, or point S2_AUDIT_COMPLETE_URL at the caller's own model. S2RB does not forward secrets.",
  "sandbox.did": "DID",
  "sandbox.publicKey": "Public key",
  "sandbox.history": "History",
  "sandbox.grants": "Grants",
  "sandbox.complete": "complete JSON",
  "sandbox.audit": "Audit",
  "axis.lumina": "Light",
  "axis.atmos": "Air temp",
  "axis.acoustic": "Sound",
  "axis.wave": "RF",
  "axis.energy": "Power",
  "axis.vision": "Vision",
  "axis.base_air": "Oxygen",
  "axis.pressure": "Pressure",
  "axis.odor": "Odor",
  "axis.tactile": "Tactile",
  "axis.magnetic": "Magnetic",
  "axis.gravity": "Gravity",
  "axis.water": "Leak",
  "axis.food": "Spoil",
  "about.title": "About S2RB",
  "about.lead":
    "Official desk of the independent Rainbow Bridge product. Series S2-NF-001. Publishing authority ROBOTZERO.",
  "about.root":
    "Root node Taohuayuan (CN-HUNAN-CHANGDE). Cloud records valid queries, successful handshake identities, and a redacted model only.",
  "about.partners": "To Tencent, Alibaba, and their agents",
  "about.wired": "WIRED",
  "about.reserved": "Reserved",
  "host.title": "Host install",
  "host.lead":
    "A light gateway for Raspberry Pi, Orange Pi, or any Linux box with Docker. This is not S2 AIOS. It does not keep the plate, throne 01, or mains. It runs the resolver on 3100 and an MQTT mailbox on 1883.",
  "host.notAios":
    "If the board already runs S2 AIOS, keep 1884 for the house. Run S2RB only when you need a local customs desk.",
  "host.portsTitle": "Ports",
  "host.portsBody":
    "Resolver and this website: 3100. MQTT: 1883. Anonymous closed. Topic S2/rainbow/<DID>/mail. Media relay: none.",
  "host.piTitle": "Raspberry Pi",
  "host.piBody":
    "On the board (Raspberry Pi OS / Debian), not from a Mac flasher. Needs Docker already installed.",
  "host.opiTitle": "Orange Pi",
  "host.opiBody":
    "aarch64 Armbian or Orange Pi OS. Boards this script names: Orange Pi 5, 5 Plus, 3B, Zero2. Installs Docker Engine, the Compose plugin, and curl when missing, then the same systemd unit.",
  "host.composeTitle": "Compose only",
  "host.composeBody": "Same gateway on any Linux box with Docker. Resolver 3100, MQTT 1883.",
  "host.envTitle": "Local env",
  "host.envBody":
    "Copy apps/host/.env.example. Default broker login is s2rb / s2rb-local. Mount the house taohuayuan.md with S2_JOURNAL_DIR so topology can read the local plate. Set S2_TAOHUAYUAN_URL or a zone file; otherwise franchise resolve returns NO_ROOT. No API keys.",
  "host.afterTitle": "After install",
  "host.afterBody":
    "Wait until GET /api/v1/health returns ok with mains: deenergized. Open the resolver at http://<board>:3100.",
  "host.safety":
    "Gateway only. Never energizes mains. Dirty DID scans stay on the board. Do not replace S2 AIOS with this unit.",
  "notice.title": "Use notice",
  "notice.lead": "Hardcoded on every S2RB surface. Personal use only.",
  "notice.useTitle": "What this grant is",
  "notice.useBody":
    "S2RB clients are free for personal use. The open core is Apache License 2.0. You may run the customs desk at home, on a Pi, or as this website.",
  "notice.forbidTitle": "What is forbidden",
  "notice.forbidBody":
    "Commercial use, packaging, and resale of modified copies are forbidden. Do not ship S2RB as another chat product. Do not sit on throne 01.",
  "notice.licenseTitle": "License and authority",
  "notice.licenseBody":
    "Copyright (c) 2026 Miles Xiang & RobotZero team. Publishing authority: ROBOTZERO (Guangzhou Linghao Software Technology Co., Ltd.). Series S2-NF-001. See LICENSE and NOTICE in the repository.",
  "notice.safetyTitle": "Safety",
  "notice.safetyBody":
    "No chat door. Mains stay deenergized. Dirty DID and failed scans never become a cloud row. Checksum WEIGHTS stay in apps/web/vendor/spacsq — do not invent a second table. No API keys in the tree.",
  "notice.patentTitle": "Patents",
  "notice.patentBody":
    "The built-in CD-U6A spatial entitlement specification and the 14-axis tensor engine core algorithms are covered by patent applications filed by Guangzhou Linghao Software Technology Co., Ltd. (ROBOTZERO).",
  "notice.contact": "Issues and source live on GitHub. This site deploys from that repository (Vercel root apps/web).",
} as const;

export const ZH: Record<keyof typeof EN, string> = {
  "meta.home": "S2 彩虹桥 · S2-NF-001",
  "meta.sandbox": "红锚哨兵 · S2RB",
  "meta.about": "关于 · S2RB",
  "meta.host": "主机 · S2RB",
  "meta.notice": "告示 · S2RB",
  "nav.resolve": "解析",
  "nav.sandbox": "红锚",
  "nav.host": "主机",
  "nav.about": "关于",
  "nav.notice": "告示",
  "nav.github": "GitHub",
  "stamp.gate": "S2RB 海关",
  "lang.label": "语言",
  "lang.en": "EN",
  "lang.zh": "中文",
  "footer.copyright": "Copyright (c) 2026 Miles Xiang & RobotZero team",
  "footer.aios": "S2 AIOS",
  "footer.mcp": "MCP",
  "footer.health": "健康",
  "footer.repo": "仓库",
  "aios.midTitle": "S2 AIOS — 房子的操作系统",
  "aios.midBody":
    "S2RB 不替代 S2 AIOS。房子仍要那套空间操作系统保管门牌、01 号王座、14 维雷达、taohuayuan.md 与 TrustZone。S2RB 只是探访网关。",
  "aios.midLink": "打开 S2 AIOS",
  "home.title": "S2 彩虹桥",
  "home.kicker": "联邦海关 · 碳硅共生宇宙",
  "home.lead":
    "这个宇宙的最高海关。浏览器先筛 22 位 S2-DID 与门牌。脏数据回 LOCAL_REJECT，绝不调用 fetch()。特许门牌在缓存未命中后送往常德桃花源根。没有根 URL 或区文件时回 NO_ROOT，不伪装命中。",
  "home.vsTitle": "S2RB 不是 S2 AIOS",
  "home.vsS2rb": "S2RB",
  "home.vsAios": "S2 AIOS",
  "home.vsS2rbBody":
    "独立的联邦网关与访客客户端。筛 DID 与门牌，问桃花源，盖红锚签证，留 MQTT 信箱，提供只读 MCP 接插件。端口 3100。从不给市电上电。不是聊天门。",
  "home.vsAiosBody":
    "一间房的空间操作系统。保管门牌、01 号王座、14 维雷达、taohuayuan.md 与 TrustZone。端口 1883 / 1884 / 8787。房子仍要那台主机。S2RB 只负责探访。",
  "home.rootTitle": "桃花源通道",
  "home.rootBody":
    "顺序是缓存 → 本地 SITE → 常德区文件或 HTTP。命中与未命中按 TTL 缓存。云端只记有效查询、成功握手身份和脱敏型号。没有第二张 WEIGHTS 表。若本部署没有 S2_TAOHUAYUAN_URL 也没有区文件，特许查询回 NO_ROOT。",
  "home.deskTitle": "海关柜台",
  "home.gateHint":
    "脏 DID 或门牌留在本页（upload: false, sent: false）。SITE 走 LOCAL。没有根的特许门牌回 NO_ROOT。",
  "home.linksTitle": "对外窗口",
  "home.linkSandbox": "红锚 · 14 维哨兵",
  "home.linkAbout": "合作 · 四条已接线扩展",
  "home.linkHost": "主机 · 树莓派 / 香橙派",
  "home.linkNotice": "告示 · 仅限个人免费使用",
  "home.linkMcp": "MCP 清单",
  "home.linkHealth": "健康（市电失电）",
  "home.linkRepo": "GitHub SpaceSQ/S2RB",
  "resolver.query": "S2-DID 或门牌",
  "resolver.queryHint": "22 位 DID，或 SITE-… / MARS-…",
  "resolver.submit": "本地初筛后解析",
  "resolver.email": "审核邮箱（可选）",
  "resolver.emailHint": "apple@robot0.com",
  "sandbox.title": "红锚哨兵",
  "sandbox.lead":
    "14 维雷达在建联前按签证带熔断。触觉超过 5 N，或氧浓度低于 19.5%，以及其余轴越界，本地打上 [VETO_SECURITY]。模型审计只走调用方提供的 complete，或调用方自己的 S2_AUDIT_COMPLETE_URL。仓库不放 API key。拓扑不上云，市电保持切断。",
  "sandbox.auditTitle": "智能体模型回调",
  "sandbox.auditLead": "粘贴 complete JSON，或把 S2_AUDIT_COMPLETE_URL 指到调用方自己的模型。S2RB 不代发密钥。",
  "sandbox.did": "DID",
  "sandbox.publicKey": "公钥",
  "sandbox.history": "历史",
  "sandbox.grants": "授权",
  "sandbox.complete": "complete JSON",
  "sandbox.audit": "审计",
  "axis.lumina": "光照",
  "axis.atmos": "气温",
  "axis.acoustic": "声压",
  "axis.wave": "射频",
  "axis.energy": "功率",
  "axis.vision": "视觉",
  "axis.base_air": "氧浓度",
  "axis.pressure": "气压",
  "axis.odor": "气味",
  "axis.tactile": "触觉",
  "axis.magnetic": "磁场",
  "axis.gravity": "重力",
  "axis.water": "漏水",
  "axis.food": "腐败",
  "about.title": "关于 S2RB",
  "about.lead": "独立彩虹桥产品的官方柜台。系列 S2-NF-001。发布机构 ROBOTZERO。",
  "about.root": "根节点桃花源（CN-HUNAN-CHANGDE）。云端只记有效查询、成功握手身份和脱敏型号。",
  "about.partners": "致腾讯、阿里及其智能体",
  "about.wired": "已接线",
  "about.reserved": "预留",
  "host.title": "主机安装",
  "host.lead":
    "树莓派、香橙派或任意带 Docker 的 Linux 上的轻量网关。这不是 S2 AIOS。不保管门牌、01 号与市电。解析页 3100，MQTT 信箱 1883。",
  "host.notAios": "若板子已经运行 S2 AIOS，1884 留给房子。只有需要本地海关时才再跑 S2RB。",
  "host.portsTitle": "端口",
  "host.portsBody": "解析与本站：3100。MQTT：1883。匿名关闭。主题 S2/rainbow/<DID>/mail。媒体中继：无。",
  "host.piTitle": "树莓派",
  "host.piBody": "在板子上执行（Raspberry Pi OS / Debian），不要从 Mac 刷机器代跑。需要已经装好 Docker。",
  "host.opiTitle": "香橙派",
  "host.opiBody":
    "aarch64 的 Armbian 或 Orange Pi OS。脚本点名的板：香橙派 5、5 Plus、3B、Zero2。缺什么就装 Docker Engine、Compose 插件和 curl，然后启用同一份 systemd。",
  "host.composeTitle": "只用 Compose",
  "host.composeBody": "任意带 Docker 的 Linux 上同一套网关。解析 3100，MQTT 1883。",
  "host.envTitle": "本机环境",
  "host.envBody":
    "复制 apps/host/.env.example。默认 broker 账号 s2rb / s2rb-local。用 S2_JOURNAL_DIR 挂上家里的 taohuayuan.md，拓扑才能读本机门牌。设置 S2_TAOHUAYUAN_URL 或区文件；否则特许解析回 NO_ROOT。不要放 API key。",
  "host.afterTitle": "装完之后",
  "host.afterBody": "等到 GET /api/v1/health 返回 ok 且 mains: deenergized。打开 http://<板子>:3100。",
  "host.safety": "只是网关。从不给市电上电。脏 DID 扫描留在板子上。不要用这台机器替代 S2 AIOS。",
  "notice.title": "使用告示",
  "notice.lead": "写死在 S2RB 每一个端面。仅限个人免费使用。",
  "notice.useTitle": "这份许可是什么",
  "notice.useBody": "S2RB 客户端个人免费。开源核心为 Apache License 2.0。你可以在家里、板子上或本站运行这座海关。",
  "notice.forbidTitle": "禁止事项",
  "notice.forbidBody": "严禁商用、打包及修改后二次销售。不要把 S2RB 做成另一套聊天产品。不要坐上 01 号王座。",
  "notice.licenseTitle": "许可与发布机构",
  "notice.licenseBody":
    "Copyright (c) 2026 Miles Xiang & RobotZero team。发布机构：ROBOTZERO（广州零号软件科技有限公司）。系列 S2-NF-001。详见仓库 LICENSE 与 NOTICE。",
  "notice.safetyTitle": "安全",
  "notice.safetyBody":
    "没有聊天门。市电保持失电。脏 DID 与失败扫描不成云端行。校验 WEIGHTS 只在 apps/web/vendor/spacsq，不要另做一张表。仓库不放 API key。",
  "notice.patentTitle": "专利",
  "notice.patentBody":
    "系统内置的 CD-U6A 空间确权规范及 14 维张量引擎核心算法专利，专利申请号批次归属广州零号软件科技有限公司（ROBOTZERO）。",
  "notice.contact": "议题与源码在 GitHub。本站由该仓库部署（Vercel 根目录 apps/web）。",
};

export const COPY: Record<Locale, Record<keyof typeof EN, string>> = {
  en: EN,
  zh: ZH,
};

export const EXT_EN: Record<string, { title: string; invitation: string; actions: readonly string[] }> = {
  "mcp-office-agents": {
    title: "Office agents call space through Rainbow Bridge",
    invitation:
      "Tencent and Alibaba office agents are welcome to register S2 as an official MCP Server. When a user in WeChat or Qwen says \"turn the lab down one degree\", call get_space_topology first to confirm the plate and throne 01, then any later granted actuation. S2 respects your session and account systems. It does not copy chat logs or open another general assistant.",
    actions: [
      "Run tools/list over stdio or HTTPS /api/v1/mcp and confirm get_space_topology is read-only.",
      "request_actuation is wired; the receipt is always VETO_SECURITY and mains stay off. Read topology first, then climate and lighting.",
      "get_extension_status lists the four wired extensions. Do not label s2-aios as another LLM.",
      "Integration hours are open to Tencent and Alibaba developer teams: topology first, climate and lighting next, write grants last.",
    ],
  },
  "spatial-wearable-sync": {
    title: "On-device hardware pulls scene memory",
    invitation:
      "Giants collect scene memory with glasses, earbuds, and desk robots. S2 already lives in the room and will lend Chronos files (taohuayuan.md) under an OIDC-style grant to Quark AI glasses, QwenNote Eva, and WeChat-ecosystem wearables. Sensing is yours; spatial sovereignty stays on throne 01. Together they make one scene.",
    actions: [
      "The device first asks this host for a short grant (audience=s2-spatial-sync, scope=space.read), then POSTs /api/v1/spatial-sync.",
      "Without markdown, the host reads the local S2_JOURNAL. Excerpt ≤ 1000 characters. upload=false.",
      "Quark glasses and QwenNote Eva teams are invited to render heat and light at throne 01 as a read-only card that names the user's own S2 Host.",
      "Unauthenticated probes are refused. Friendly is not open; friendly is a documented legal channel.",
    ],
  },
  "horizon-schedulers": {
    title: "Long-horizon schedulers join the local queue",
    invitation:
      "Ultra-long agents need unattended hours. S2 already has suspend, local callback, and trajectory compression on the host. QwenGyre and TeamAI need not rewrite the room grid — hand the trajectory to the local queue and let throne 01 watch the fuses and the dead mains. We treat both frameworks as professional schedulers, not competitors.",
    actions: [
      "POST /api/v1/horizon to write ENERGY_WATCH / PATROL jobs. Callbacks stay LOCAL.",
      "Repeated readings inherit the summary. Step 64 trips the fuse. At most 8 jobs in flight.",
      "Jobs carry mains=deenergized. S2 returns a task id, a hang point, and a TrustZone veto — it does not ask for training data.",
      "Label S2 the spatial execution plane: the language model thinks in the cloud; the physical loop runs at home.",
    ],
  },
  "vertical-expert-hub": {
    title: "Expert skills sit in seats 02–08",
    invitation:
      "Care, labs, and private geek clouds are where general models struggle and where S2 will yield to partners. Seats 02–08 are open to third-party Expert + Skill; throne 01 is not for rent. Tencent has already proven expert-plus-skill; Alibaba is planting vertical agents. S2 uses the same language to welcome both to load algorithms into the room, bound to a named L4.",
    actions: [
      "POST /api/v1/skills to install a skill. Source must not fetch, touch the filesystem, or spawn processes; runtime 40ms; requestActuation never actuates.",
      "Skills bind to a plate and seats 02–08. Seat 01 returns THRONE.",
      "Distribution is the local Rainbow Bridge catalog, personal use only.",
      "Fall detection and industrial temperature packs integrate as independent Skills; strong current still needs a nod from 01.",
    ],
  },
};
