import assert from "node:assert/strict";
import test from "node:test";
import { allowCloudFetch, createMemoryCache, createMemoryDump, guardedFetch, resolveQuery, screenDid } from "../src/s2rb_dns_root.ts";
import { assembleS2Did } from "../src/spacsq-seam.ts";

const valid = assembleS2Did("DHOME1251009", "00000001");
if (!valid) throw new Error("fixture");

test("a short or dirty DID dies locally and never calls the root", async () => {
  const dump = createMemoryDump();
  let looked = 0;
  const dirty = await resolveQuery({
    raw: "not-a-did",
    dump,
    lookup: async () => {
      looked += 1;
      return { ok: true, lane: "TAOHUAYUAN", query: "x" };
    },
  });
  assert.equal(dirty.ok, false);
  if (dirty.ok) return;
  assert.equal(dirty.upload, false);
  assert.equal(looked, 0);
  assert.equal(dump.rows.length, 1);
  assert.equal(allowCloudFetch("ABCDEF").ok, false);
  assert.equal(screenDid(valid).ok, true);
  if (!screenDid(valid).ok) return;
  assert.equal(screenDid(valid).clean.length, 22);
});

test("screenDid blocks a short or illegal DID before any network request", async () => {
  let hits = 0;
  const fetchImpl: typeof fetch = async () => {
    hits += 1;
    return new Response("{}", { status: 200 });
  };
  const short = screenDid("ABC123");
  assert.equal(short.ok, false);
  if (short.ok) return;
  assert.equal(short.code, "LOCAL_REJECT");
  assert.equal(short.reason, "DID_LENGTH");
  const dirty = screenDid("!!!!!!!!!!!!!!!!!!!!!!");
  assert.equal(dirty.ok, false);
  if (dirty.ok) return;
  assert.equal(dirty.code, "LOCAL_REJECT");
  assert.equal(dirty.reason, "DID_CHARSET");
  const forged = await guardedFetch("AAAAAAAAAAAAAAAAAAAAAA", fetchImpl, "https://s2rb.space2.world/api/v1/resolve");
  assert.equal(forged.ok, false);
  if (forged.ok) return;
  assert.equal(forged.sent, false);
  const wired = await guardedFetch("NOT22CHARS", fetchImpl, "https://s2rb.space2.world/api/v1/resolve");
  assert.equal(wired.ok, false);
  if (wired.ok) return;
  assert.equal(wired.code, "LOCAL_REJECT");
  assert.equal(wired.sent, false);
  assert.equal(hits, 0);
});

test("SITE stays local and a MARS query may go to Taohuayuan after the gate", async () => {
  const cache = createMemoryCache();
  const site = await resolveQuery({ raw: "SITE-GZTIANHE-TIYUXILU-SHEJIDASHA-ROOM01-01", cache });
  assert.equal(site.ok, true);
  if (!site.ok) return;
  assert.equal(site.lane, "LOCAL");
  let looked = 0;
  const mars = await resolveQuery({
    raw: "MARS-CN-001-MYHOME-ROOM02-05",
    cache,
    lookup: async (body) => {
      looked += 1;
      assert.equal(body.handshake, "HIT");
      assert.equal(body.query.startsWith("MARS-"), true);
      return { ok: true, lane: "TAOHUAYUAN", query: body.query, root: "TAOHUAYUAN", source: "HTTP" };
    },
  });
  assert.equal(mars.ok, true);
  if (!mars.ok) return;
  assert.equal(mars.lane, "TAOHUAYUAN");
  assert.equal(looked, 1);
  const echo = await resolveQuery({ raw: "MARS-CN-001-MYHOME-ROOM02-05" });
  assert.equal(echo.ok, false);
  if (!echo.ok) assert.equal(echo.code, "NO_ROOT");
  assert.equal(allowCloudFetch("PHYS-ZZ-001-BASE-ROOM01-01").ok, false);
});
