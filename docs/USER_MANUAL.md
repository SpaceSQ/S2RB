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
| Raspberry Pi / Orange Pi / Linux host | `apps/host` | `docker compose up -d` | Resolver :3100 + MQTT :1883 |

Need Node.js ≥ 22.18. Desktop also needs Rust (`cargo`). Mobile APK needs `eas-cli`.

## 3. First use

1. Open the resolver (site, localhost:3100, desktop window, or phone).
2. Paste a **22-character** S2-DID (`A–Z` / `0–9`) or a plate such as `SITE-…-ROOM01-01` / `MARS-CN-001-MYHOME-ROOM01-09`.
3. Dirty tokens return `LOCAL_REJECT` and never leave the device.
4. On home Wi-Fi, tap scan. Desktop and phone look for `http://<ip>:1884/lan` on an S2 AIOS host.
5. App Store review account `apple@robot0.com` skips LAN and injects three legal virtual DIDs.

You do **not** paste a DeepSeek / Qwen / OpenAI API key.

## 4. After a clean resolve

- Franchise domains (`MARS` / `MOON` / `PHYS` / `GAME` / `MYTH`) go to the Taohuayuan root after the local gate. Hits and misses cache with a TTL. Set `S2_TAOHUAYUAN_URL` or a zone file; without either, the answer is `NO_ROOT`, not a fake hit.
- Red Anchor reads 14-axis radar from the target host. Tactile > 5 N or oxygen < 19.5% → `[VETO_SECURITY]`.
- MQTT mailbox topic: `S2/rainbow/<DID>/mail`. Media hole: no relay, no store.
- Partners: `/about` and `GET /api/v1/mcp` (`get_space_topology` is read-only).

## 5. Raspberry Pi / Orange Pi host

```bash
git clone https://github.com/SpaceSQ/S2RB.git
cd S2RB/apps/host
# Raspberry Pi OS / Debian:
sudo ./install-pi.sh
# Orange Pi (Armbian / Orange Pi OS, aarch64 — 5 / 5 Plus / 3B / Zero2):
sudo ./install-opi.sh
```

Both boards run the same gateway: Docker Compose + systemd, resolver **3100**, MQTT **1883**. `install-opi.sh` installs Docker Engine, the Compose plugin, and curl when they are missing, then enables the same `s2rb-host.service` and waits for `/api/v1/health`. This box is a **gateway**, not a replacement for S2 AIOS. If the board already runs S2 AIOS, keep 1884 for the house and run S2RB on 3100 only if you need a local resolver.

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
| 树莓派 / 香橙派 | `apps/host` | `docker compose up -d` | 3100 + 1883 |

## 3. 第一次用

打开解析页，粘贴 22 位 DID 或门牌。脏数据 `LOCAL_REJECT`，不上网。家里 Wi-Fi 下点扫描，找 S2 AIOS 的 `:1884/lan`。不要填 API Key。

## 4. 解析通过之后

特许域在本地筛过后问桃花源根。未配置根地址或区文件时回 `NO_ROOT`，不伪装命中。红锚读 14 维：触觉 > 5 N 或氧气 < 19.5% 否决。信箱主题 `S2/rainbow/<DID>/mail`。MCP 只读。

## 5. 树莓派 / 香橙派

树莓派：`sudo ./install-pi.sh`。香橙派（Armbian / Orange Pi OS，aarch64，常见板：5 / 5 Plus / 3B / Zero2）：`sudo ./install-opi.sh`，缺什么就装 Docker、Compose、curl。两套脚本启用同一份 systemd，等 `:3100/api/v1/health` 通了才算启动成功。这是网关，不是第二套 S2 AIOS。

## 6. 许可

Apache License 2.0。Copyright (c) 2026 Miles Xiang & RobotZero team。ROBOTZERO（广州零号软件科技有限公司）。
