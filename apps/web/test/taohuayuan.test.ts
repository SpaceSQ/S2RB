import assert from "node:assert/strict";
import test from "node:test";
import { assembleS2Did } from "../src/spacsq-seam.ts";
import { createMemoryCache, resolveHttpStatus, resolveQuery } from "../src/s2rb_dns_root.ts";
import { GET as health } from "../app/api/v1/health/route.ts";
import { askTaohuayuan, parseZoneText } from "../src/taohuayuan.ts";

const valid = assembleS2Did("DHOME1251009", "00000001");
if (!valid) throw new Error("fixture");
const mars = "MARS-CN-001-MYHOME-ROOM02-05";

test("health names the service and does not claim a root that is not configured", async () => {
  const res = health();
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.service, "s2rb");
  assert.equal(body.mains, "deenergized");
  assert.equal(body.upload, false);
  assert.equal(body.root.url, false);
});

test("zone text drops dirty lines and maps a screened franchise plate", () => {
  const zone = parseZoneText(`# comment\nSHORT\n${mars}\n${valid} SITE-GZTIANHE-TIYUXILU-SHEJIDASHA-ROOM01-01\n`);
  assert.equal(zone.has(mars), true);
  assert.equal(zone.get(valid), "SITE-GZTIANHE-TIYUXILU-SHEJIDASHA-ROOM01-01");
  assert.equal(zone.has("SHORT"), false);
});

test("askTaohuayuan never fetches a dirty token and does not echo a hit without a root", async () => {
  let hits = 0;
  const dirty = await askTaohuayuan({
    query: "not-a-did",
    env: { S2_TAOHUAYUAN_URL: "https://root.example/v1" },
    fetchImpl: async () => {
      hits += 1;
      return new Response("{}", { status: 200 });
    },
  });
  assert.equal(dirty.ok, false);
  assert.equal(hits, 0);
  const bare = await askTaohuayuan({ query: mars, env: {} });
  assert.equal(bare.ok, false);
  if (!bare.ok) assert.equal(bare.code, "NO_ROOT");
});

test("zone hit, zone miss, HTTP hit, HTTP miss, and upstream fault stay distinct", async () => {
  const zoned = await askTaohuayuan({
    query: mars,
    env: { S2_TAOHUAYUAN_ZONE_TEXT: mars },
  });
  assert.equal(zoned.ok, true);
  if (zoned.ok) assert.equal(zoned.source, "ZONE");
  const missed = await askTaohuayuan({
    query: mars,
    env: { S2_TAOHUAYUAN_ZONE_TEXT: "MARS-CN-001-OTHERHOME-ROOM01-01" },
  });
  assert.equal(missed.ok, false);
  if (!missed.ok) assert.equal(missed.code, "MISS");
  let sent = "";
  const httpHit = await askTaohuayuan({
    query: mars,
    env: { S2_TAOHUAYUAN_URL: "https://root.example/v1" },
    fetchImpl: async (url, init) => {
      sent = `${url} ${init?.body}`;
      return new Response(JSON.stringify({ ok: true, address: mars }), { status: 200 });
    },
  });
  assert.equal(httpHit.ok, true);
  if (httpHit.ok) {
    assert.equal(httpHit.source, "HTTP");
    assert.equal(httpHit.address, mars);
  }
  assert.match(sent, /root.example/);
  assert.match(sent, new RegExp(mars));
  const httpMiss = await askTaohuayuan({
    query: mars,
    env: { S2_TAOHUAYUAN_URL: "https://root.example/v1" },
    fetchImpl: async () => new Response(JSON.stringify({ ok: false, code: "MISS" }), { status: 404 }),
  });
  assert.equal(httpMiss.ok, false);
  if (!httpMiss.ok) assert.equal(httpMiss.code, "MISS");
  const down = await askTaohuayuan({
    query: mars,
    env: { S2_TAOHUAYUAN_URL: "https://root.example/v1" },
    fetchImpl: async () => new Response("no", { status: 502 }),
  });
  assert.equal(down.ok, false);
  if (!down.ok) assert.equal(down.code, "UPSTREAM");
});

test("resolveQuery caches a hit, expires it, and never caches an upstream fault", async () => {
  const cache = createMemoryCache({ hitTtlMs: 10, missTtlMs: 10 });
  let looked = 0;
  const first = await resolveQuery({
    raw: mars,
    nowMs: 100,
    cache,
    lookup: async () => {
      looked += 1;
      return { ok: true, lane: "TAOHUAYUAN", query: mars, root: "TAOHUAYUAN", source: "HTTP" };
    },
  });
  assert.equal(first.ok, true);
  if (first.ok) assert.equal(first.lane, "TAOHUAYUAN");
  const cached = await resolveQuery({ raw: mars, nowMs: 105, cache, lookup: async () => {
    looked += 1;
    return { ok: false, code: "UPSTREAM", upload: false };
  } });
  assert.equal(cached.ok, true);
  if (cached.ok) {
    assert.equal(cached.lane, "CACHE");
    assert.equal(cached.via, "TAOHUAYUAN");
  }
  assert.equal(looked, 1);
  const expired = await resolveQuery({
    raw: mars,
    nowMs: 120,
    cache,
    lookup: async () => {
      looked += 1;
      return { ok: false, code: "UPSTREAM", upload: false };
    },
  });
  assert.equal(expired.ok, false);
  if (!expired.ok) assert.equal(expired.code, "UPSTREAM");
  assert.equal(looked, 2);
  const again = await resolveQuery({
    raw: mars,
    nowMs: 121,
    cache,
    lookup: async () => {
      looked += 1;
      return { ok: false, code: "UPSTREAM", upload: false };
    },
  });
  assert.equal(again.ok, false);
  assert.equal(looked, 3);
  assert.equal(resolveHttpStatus(first), 200);
  assert.equal(resolveHttpStatus(expired), 503);
});

test("a franchise miss is cached briefly and SITE never calls the root", async () => {
  const cache = createMemoryCache({ missTtlMs: 50 });
  let looked = 0;
  const miss = await resolveQuery({
    raw: mars,
    nowMs: 1,
    cache,
    lookup: async () => {
      looked += 1;
      return { ok: false, code: "MISS", query: mars, root: "TAOHUAYUAN", upload: false };
    },
  });
  assert.equal(miss.ok, false);
  if (!miss.ok) assert.equal(miss.code, "MISS");
  assert.equal(resolveHttpStatus(miss), 404);
  await resolveQuery({ raw: mars, nowMs: 2, cache, lookup: async () => {
    looked += 1;
    return { ok: true, lane: "TAOHUAYUAN", query: mars, root: "TAOHUAYUAN", source: "HTTP" };
  } });
  assert.equal(looked, 1);
  const site = await resolveQuery({
    raw: "SITE-GZTIANHE-TIYUXILU-SHEJIDASHA-ROOM01-01",
    cache,
    lookup: async () => {
      looked += 1;
      return { ok: true, lane: "TAOHUAYUAN", query: "x", root: "TAOHUAYUAN", source: "HTTP" };
    },
  });
  assert.equal(site.ok, true);
  if (site.ok) assert.equal(site.lane, "LOCAL");
  assert.equal(looked, 1);
});
