# S2RB User Manual / 彩虹桥使用说明书

English first. Whitepapers: [EN](./WHITEPAPER.en.md) · [ZH](./WHITEPAPER.zh.md). Relation to the house OS: [S2_AIOS_RELATION.md](./S2_AIOS_RELATION.md).

---

# Part I — English

## 1. What you are installing

S2 Rainbow Bridge is an independent product. Clone **this** repository (`https://github.com/SpaceSQ/S2RB`), not the S2 AIOS monorepo, if you only need the gateway.

S2RB is free for personal use only. Commercial use, repackaging, and resale of modified copies are forbidden.

## 2. Choose a surface

| Surface | Path | Command | Result |
| --- | --- | --- | --- |
| Web (any OS) | `apps/web` | `npm install && npm run dev -- --port 3100` | Resolver at http://127.0.0.1:3100 |
| Production web | Vercel root `apps/web` | deploy | https://s2rb.space2.world |
| Windows | `apps/desktop` | `npm run build:exe` | NSIS installer (WebView2 bootstrapper if missing) |
| macOS | `apps/desktop` | `npm run build:dmg` | `.dmg`, tray resident |
| iOS / Android | `apps/mobile` | `npm run build:apk` / `build:ios` | Expo / EAS |
| Raspberry Pi / Linux host | `apps/host` | `docker compose up -d` | Resolver :3100 + optional MQTT :1883 |

Need Node.js ≥ 22.18. Desktop also needs Rust (`cargo`). Mobile APK needs `eas-cli`.

## 3. First use

1. Open the resolver (site, localhost:3100, desktop window, or phone).
2. Paste a **22-character** S2-DID (`A–Z` / `0–9`) or a plate such as `SITE-…-ROOM01-01` / `MARS-CN-001-MYHOME-ROOM01-09`.
3. Dirty tokens return `LOCAL_REJECT` and never leave the device.
4. On home Wi-Fi, tap scan. Desktop and phone look for `http://<ip>:1884/lan` on an S2 AIOS host.
5. App Store review account `apple@robot0.com` skips LAN and injects three legal virtual DIDs.

You do **not** paste a DeepSeek / Qwen / OpenAI API key.

## 4. After a clean resolve

- Optional Taohuayuan lookup for franchise domains (`MARS` / `MOON` / `PHYS` / `GAME` / `MYTH`).
- Red Anchor reads 14-axis radar from the target host. Tactile > 5 N or oxygen < 19.5% → `[VETO_SECURITY]`.
- MQTT mailbox topic: `S2/rainbow/<DID>/mail`. Media hole: no relay, no store.
- Partners: `/about` and `GET /api/v1/mcp` (`get_space_topology` is read-only).

## 5. Raspberry Pi host

```bash
git clone https://github.com/SpaceSQ/S2RB.git
cd S2RB/apps/host
docker compose up -d
sudo cp s2rb-host.service /etc/systemd/system/
sudo systemctl enable --now s2rb-host
```

This box is a **gateway**, not a replacement for S2 AIOS on the same Pi. If the Pi already runs S2 AIOS, keep 1884 for the house and run S2RB on 3100 only if you need a local resolver.

## 6. Safety

- Strong-current actuators stay deenergized.
- Failed DID scans stay in local dump / SQLite. They are not a cloud row.
- Checksum WEIGHTS live in `apps/web/vendor/spacsq`. Do not edit.

## 7. License

Apache License 2.0 for the open core.  
Copyright (c) 2026 Miles Xiang & RobotZero team  
ROBOTZERO (Guangzhou Linghao Software Technology Co., Ltd.)

---

# 第二部分 — 中文

## 1. 你在装什么

S2 彩虹桥是**独立产品**。只要网关，请克隆本仓库 `https://github.com/SpaceSQ/S2RB`，不要把 S2 AIOS 整树当发布物。

仅限个人免费使用，严禁商用、打包及修改后二次销售。

## 2. 选一个端面

| 端面 | 路径 | 命令 | 结果 |
| --- | --- | --- | --- |
| 网站 | `apps/web` | `npm run dev -- --port 3100` | http://127.0.0.1:3100 |
| 生产站 | Vercel 根目录 `apps/web` | 部署 | https://s2rb.space2.world |
| Windows | `apps/desktop` | `npm run build:exe` | 安装包 |
| macOS | `apps/desktop` | `npm run build:dmg` | 托盘常驻 |
| 手机 | `apps/mobile` | `npm run build:apk` | Expo / EAS |
| 树莓派 | `apps/host` | `docker compose up -d` | 3100 + 可选 1883 |

## 3. 第一次用

打开解析页，粘贴 22 位 DID 或门牌。脏数据 `LOCAL_REJECT`，不上网。家里 Wi-Fi 下点扫描，找 S2 AIOS 的 `:1884/lan`。不要填 API Key。

## 4. 解析通过之后

特许域可走桃花源根。红锚读 14 维：触觉 > 5 N 或氧气 < 19.5% 否决。信箱主题 `S2/rainbow/<DID>/mail`。MCP 只读。

## 5. 树莓派

按上面 `apps/host` 的 compose 与 systemd。这是网关，不是第二套 S2 AIOS。

## 6. 许可

Apache License 2.0。Copyright (c) 2026 Miles Xiang & RobotZero team。ROBOTZERO（广州零号软件科技有限公司）。
