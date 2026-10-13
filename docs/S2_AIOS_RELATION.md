# How S2RB relates to S2 AIOS / S2RB 与 S2 AIOS 的关联

English first.

| | S2 AIOS | S2RB |
| --- | --- | --- |
| Repository | https://github.com/SpaceSQ/S2AIOS | https://github.com/SpaceSQ/S2RB |
| Role | Spatial operating system for one room | Federation gateway and visitor client |
| Owns | Doorplate, 01 avatar, 14-axis radar, `taohuayuan.md`, TrustZone | DID screen, Taohuayuan root, Red Anchor visa, MQTT mailbox, MCP |
| Ports | 1883 MQTT, 1884 cockpit, 8787 companion | 3100 resolver (this repo) |
| Install | Docker on a spare PC, or resident on Orange Pi / Raspberry Pi | Web / Windows `.exe` / macOS `.dmg` / Expo APK / Pi host compose |
| Chat door | No | No |
| Mains | Deenergized unless TrustZone admits | Never energizes |

S2RB does **not** replace S2 AIOS. A house still needs an S2 AIOS host to hold the throne. S2RB is how phones, laptops, office agents, and other L4 spaces **visit** that house under zero trust.

Typical pairing:

1. Provision S2 AIOS (see https://github.com/SpaceSQ/S2AIOS — user manual).
2. On the same LAN, open S2RB desktop / mobile and scan `:1884/lan`.
3. Off-LAN, paste a 22-character S2-DID at https://s2rb.space2.world. Dirty tokens die locally.
4. WorkBuddy / QoderWork attach through `GET /api/v1/mcp` — they plug into the physical layer; they do not sit on seat 01.

Checksum weights stay in `apps/web/vendor/spacsq`. Do not invent a second WEIGHTS table.

---

## 中文

| | S2 AIOS | S2RB |
| --- | --- | --- |
| 仓库 | https://github.com/SpaceSQ/S2AIOS | https://github.com/SpaceSQ/S2RB |
| 角色 | 一间房的空间操作系统 | 联邦网关与访客客户端 |
| 保管 | 门牌、01 号、14 维雷达、`taohuayuan.md`、TrustZone | DID 筛、桃花源根、红锚签证、MQTT 信箱、MCP |
| 端口 | 1883 / 1884 / 8787 | 本仓库解析页 3100 |
| 安装 | Docker 或板子常驻 | 网站 / Windows / Mac / 手机 / 树莓派网关 |
| 聊天门 | 不是 | 不是 |
| 强电 | 默认失电 | 从不给市电上电 |

S2RB **不替代** S2 AIOS。房子仍要有一台 S2 AIOS 主机坐王座。S2RB 是手机、电脑、办公智能体和其他 L4 空间在零信任下**探访**那间房的方式。

典型配对：先按 S2 AIOS 说明书确权主机；同一 Wi-Fi 用桌面 / 手机扫 `:1884/lan`；离开局域网则在 https://s2rb.space2.world 粘贴 22 位 DID。脏数据只死在本机。
