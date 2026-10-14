# S2RB Host / 彩虹桥主机端

English first.

Lightweight gateway for **Raspberry Pi**, **Orange Pi**, or any Linux box with Docker. This is **not** S2 AIOS. It does not own `taohuayuan.md`, the 01 throne, or mains. It runs the S2RB resolver (port **3100**) and an MQTT mailbox (port **1883**, topic `S2/rainbow/<DID>/mail`, anonymous closed). Default broker login is `s2rb` / `s2rb-local`. Copy `.env.example` and mount the house `taohuayuan.md` via `S2_JOURNAL_DIR` so topology can read the local doorplate.

```bash
cd apps/host
docker compose up -d
# Raspberry Pi (Raspberry Pi OS / Debian): copy, enable systemd, wait for /api/v1/health
sudo ./install-pi.sh
# Orange Pi (Armbian / Orange Pi OS, aarch64 — 5 / 5 Plus / 3B / Zero2):
# installs Docker Engine, Compose plugin, and curl when missing, then the same unit
sudo ./install-opi.sh
```

Windows / macOS developers should use `apps/desktop` (Tauri) plus `apps/web`.  
A house that already runs S2 AIOS keeps using that host on **1884**; S2RB only visits.

中文：树莓派 / 香橙派 / Linux 上的轻量网关。不是 S2 AIOS，不保管门牌与 01 号。解析页 3100，MQTT 1883 只放行 `S2/rainbow/<DID>/mail`。香橙派（Armbian / Orange Pi OS，aarch64）用 `sudo ./install-opi.sh`，依赖与树莓派相同：Docker、Compose、curl。把家里的 `taohuayuan.md` 挂到 `S2_JOURNAL_DIR`，拓扑就会读本机门牌。
