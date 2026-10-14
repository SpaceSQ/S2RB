const DID = /^[A-Z0-9]{22}$/;

function memoryStore() {
  const key = "s2-desktop-local";
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(key) || "{\"dids\":[],\"hands\":[],\"mail\":[]}");
    } catch {
      return { dids: [], hands: [], mail: [] };
    }
  };
  const write = (value) => localStorage.setItem(key, JSON.stringify(value));
  return {
    async whitelist_add(did) {
      const clean = did.trim().toUpperCase();
      if (!DID.test(clean)) throw new Error("DID_LENGTH");
      const bag = read();
      if (!bag.dids.includes(clean)) bag.dids.push(clean);
      write(bag);
      return clean;
    },
    async whitelist_list() { return read().dids; },
    async handshake_record(did, host) {
      const bag = read();
      bag.hands.unshift({ did, host, at_ms: Date.now() });
      write(bag);
      return Date.now();
    },
    async handshake_list() { return read().hands; },
    async mqtt_status() { return { connected: false, host: "", last_topic: "S2/rainbow/+/mail" }; },
    async discovered_hosts() { return []; },
    async mqtt_bind(host) { return host; },
    async mail_list() { return read().mail || []; },
    async mail_post(toDid, fromDid, body) {
      const bag = read();
      bag.mail = bag.mail || [];
      bag.mail.unshift({ toDid, fromDid, body, atMs: Date.now() });
      write(bag);
      return Date.now();
    },
  };
}

async function api(name, args) {
  const core = window.__TAURI__ && window.__TAURI__.core;
  if (core && core.invoke) return core.invoke(name, args);
  const mem = memoryStore();
  if (name === "whitelist_add") return mem.whitelist_add(args.did);
  if (name === "whitelist_list") return mem.whitelist_list();
  if (name === "handshake_record") return mem.handshake_record(args.did, args.host);
  if (name === "handshake_list") return mem.handshake_list();
  if (name === "mqtt_status") return mem.mqtt_status();
  if (name === "discovered_hosts") return mem.discovered_hosts();
  if (name === "mqtt_bind") return mem.mqtt_bind(args.host);
  if (name === "mail_list") return mem.mail_list();
  if (name === "mail_post") return mem.mail_post(args.toDid, args.fromDid, args.body);
  throw new Error(name);
}

function subnetHosts(ip) {
  const found = new Set(["192.168.4.1"]);
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return [...found];
  const base = parts.slice(0, 3).join(".");
  for (let n = 1; n <= 254; n += 1) {
    const next = `${base}.${n}`;
    if (next !== ip) found.add(next);
  }
  return [...found];
}

async function probe(host) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 400);
  try {
    const res = await fetch(`http://${host}:1884/lan`, { signal: ctrl.signal });
    const body = await res.json();
    if (body && body.service === "s2-aios") return host;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
  return null;
}

async function scanLan() {
  const status = document.getElementById("scan-status");
  status.textContent = "正在扫描家庭网段的 1884 端口…";
  const guessed = document.getElementById("host").value.trim() || "192.168.1.1";
  const hosts = subnetHosts(guessed);
  const hits = [];
  for (let i = 0; i < hosts.length; i += 24) {
    const batch = await Promise.all(hosts.slice(i, i + 24).map(probe));
    for (const host of batch) if (host) hits.push(host);
    if (hits.length) break;
  }
  const fromUdp = await api("discovered_hosts", {});
  for (const host of fromUdp) if (!hits.includes(host)) hits.push(host);
  const list = document.getElementById("hosts");
  list.innerHTML = hits.map((host) => `<li>${host}</li>`).join("") || "<li>这一轮没有听到 Host</li>";
  if (hits[0]) document.getElementById("host").value = hits[0];
  status.textContent = hits.length ? `听到 ${hits.length} 台 S2 Host` : "没有听到 1884/lan。确认 docker compose 已起来。";
  return hits;
}

async function paint() {
  const dids = await api("whitelist_list", {});
  document.getElementById("dids").innerHTML = dids.map((did) => `<li>${did}</li>`).join("");
  const hands = await api("handshake_list", {});
  document.getElementById("hands").innerHTML = hands.map((row) => `<li>${row.did} · ${row.host}</li>`).join("");
  const mqtt = await api("mqtt_status", {});
  document.getElementById("mqtt").textContent = mqtt.connected
    ? `已连接 ${mqtt.host}:1883 ${mqtt.last_topic || "S2/rainbow/+/mail"}`
    : "MQTT 未连上。绑定 Host 后只订 S2/rainbow/+/mail。";
  const mail = await api("mail_list", {});
  document.getElementById("mail").innerHTML = mail.map((row) => `<li>${row.toDid} ← ${row.fromDid} · ${row.body}</li>`).join("");
}

document.getElementById("scan").onclick = () => { scanLan().then(paint); };
document.getElementById("add-did").onclick = async () => {
  try {
    await api("whitelist_add", { did: document.getElementById("did").value });
    document.getElementById("did").value = "";
    await paint();
  } catch {
    document.getElementById("scan-status").textContent = "DID 必须通过本机 22 位校验和筛。";
  }
};
document.getElementById("bind").onclick = async () => {
  const host = document.getElementById("host").value.trim();
  if (!host) return;
  const frame = document.getElementById("cockpit");
  frame.hidden = false;
  frame.src = `http://${host}:1884/cockpit`;
  await api("mqtt_bind", {
    host,
    username: document.getElementById("mqtt-user").value,
    password: document.getElementById("mqtt-pass").value,
  });
  const dids = await api("whitelist_list", {});
  if (dids[0]) await api("handshake_record", { did: dids[0], host });
  await paint();
};

document.getElementById("mail-send").onclick = async () => {
  const toDid = document.getElementById("mail-to").value;
  const body = document.getElementById("mail-body").value;
  const dids = await api("whitelist_list", {});
  try {
    await api("mail_post", { toDid, fromDid: dids[0] || toDid, body });
    document.getElementById("mail-body").value = "";
    await paint();
  } catch {
    document.getElementById("scan-status").textContent = "投递前须通过同一道 DID 校验，并先绑定 Host。";
  }
};

paint();
