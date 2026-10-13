export const DID = /^[A-Z0-9]{22}$/;

export function subnetHosts(localIp) {
  const found = new Set(["192.168.4.1"]);
  const parts = String(localIp || "").split(".").map(Number);
  if (parts.length !== 4 || parts.some((item) => !Number.isInteger(item))) return [...found];
  const base = `${parts[0]}.${parts[1]}.${parts[2]}`;
  for (let host = 1; host <= 254; host += 1) {
    const next = `${base}.${host}`;
    if (next !== localIp) found.add(next);
  }
  return [...found];
}

export function lanCardUrl(host) {
  return `http://${host}:1884/lan`;
}

export async function probeHost(host, timeoutMs = 400) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(lanCardUrl(host), { signal: ctrl.signal });
    const body = await res.json();
    if (body && body.service === "s2-aios") {
      return { host, mqtt: body.mqtt || 1883, cockpit: body.cockpit || 1884 };
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
  return null;
}

export async function scanLan(localIp) {
  const hosts = subnetHosts(localIp);
  const hits = [];
  for (let i = 0; i < hosts.length; i += 24) {
    const batch = await Promise.all(hosts.slice(i, i + 24).map((host) => probeHost(host)));
    for (const hit of batch) if (hit) hits.push(hit);
    if (hits.length) break;
  }
  return hits;
}
