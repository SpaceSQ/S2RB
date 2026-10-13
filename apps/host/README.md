# S2RB Host / 彩虹桥主机端

English first.

Lightweight gateway for **Raspberry Pi**, Orange Pi, or any Linux box with Docker. This is **not** S2 AIOS. It does not own `taohuayuan.md`, the 01 throne, or mains. It runs the S2RB resolver (port **3100**) and an optional MQTT mailbox (port **1883**).

```bash
cd apps/host
docker compose up -d
# Raspberry Pi after copy to /opt/s2rb
sudo cp s2rb-host.service /etc/systemd/system/
sudo systemctl enable --now s2rb-host
```

Windows / macOS developers should use `apps/desktop` (Tauri) plus `apps/web`.  
A house that already runs S2 AIOS keeps using that host on **1884**; S2RB only visits.

中文：树莓派 / Linux 上的轻量网关。不是 S2 AIOS，不保管门牌与 01 号。解析页 3100，可选 MQTT 1883。
