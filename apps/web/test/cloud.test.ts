import assert from "node:assert/strict";
import test from "node:test";
import { allowlistRows, recordValidLookup } from "../lib/cloud.ts";
import { assembleS2Did } from "../src/spacsq-seam.ts";

const did = assembleS2Did("DHOME1251009", "00000001");
if (!did) throw new Error("fixture");
const plate = "MARS-CN-001-MYHOME-ROOM02-05";

test("dirty queries never become an allowlist row or a fetch", async () => {
  const planned = allowlistRows({ query: "SHORT", kind: "DID", handshake: "HIT", model: "s2rb-web" });
  assert.equal(planned.ok, false);
  if (planned.ok) return;
  assert.equal(planned.upload, false);
  let hits = 0;
  const wrote = await recordValidLookup(
    { query: "!!!!!!!!!!!!!!!!!!!!!!", kind: "DID", handshake: "HIT", model: "s2rb-web" },
    {
      url: "https://example.supabase.co",
      key: "anon",
      fetchImpl: async () => {
        hits += 1;
        return new Response("{}", { status: 201 });
      },
    },
  );
  assert.equal(wrote.ok, false);
  if (wrote.ok) return;
  assert.equal(wrote.code, "LOCAL_REJECT");
  assert.equal(hits, 0);
});

test("a valid DID writes lookup, handshake, and redacted model — not a model column on lookup", async () => {
  const planned = allowlistRows({ query: did, kind: "DID", handshake: "HIT", model: "s2rb-web!!!" });
  assert.equal(planned.ok, true);
  if (!planned.ok) return;
  assert.deepEqual(planned.rows.lookup, { query: did, kind: "DID" });
  assert.equal("model" in planned.rows.lookup, false);
  assert.deepEqual(planned.rows.handshake, { did, agent_class: "D" });
  assert.deepEqual(planned.rows.model, { model: "s2rb-web" });

  const posted: { table: string; body: Record<string, string> }[] = [];
  const wrote = await recordValidLookup(
    { query: did.toLowerCase(), kind: "DID", handshake: "HIT", model: "s2rb-web!!!" },
    {
      url: "https://example.supabase.co/",
      key: "anon",
      fetchImpl: async (input, init) => {
        const url = String(input);
        const table = url.slice(url.lastIndexOf("/") + 1);
        posted.push({ table, body: JSON.parse(String(init?.body)) });
        return new Response("{}", { status: 201 });
      },
    },
  );
  assert.equal(wrote.ok, true);
  if (!wrote.ok) return;
  assert.deepEqual(wrote.tables, ["s2rb_valid_lookup", "s2rb_client_model", "s2rb_handshake"]);
  assert.deepEqual(posted.map((row) => row.table), ["s2rb_valid_lookup", "s2rb_handshake", "s2rb_client_model"]);
  assert.deepEqual(posted[0]?.body, { query: did, kind: "DID" });
  assert.deepEqual(posted[1]?.body, { did, agent_class: "D" });
  assert.deepEqual(posted[2]?.body, { model: "s2rb-web" });
});

test("a franchise plate writes lookup and model and skips handshake", async () => {
  const planned = allowlistRows({ query: plate, kind: "ADDRESS", handshake: "HIT", model: "desktop 1" });
  assert.equal(planned.ok, true);
  if (!planned.ok) return;
  assert.equal(planned.rows.lookup.kind, "ADDRESS");
  assert.equal(planned.rows.handshake, undefined);
  assert.equal(planned.rows.model.model, "desktop1");

  const tables: string[] = [];
  const wrote = await recordValidLookup(
    { query: plate, kind: "ADDRESS", handshake: "HIT", model: "desktop 1" },
    {
      url: "https://example.supabase.co",
      key: "anon",
      fetchImpl: async (input) => {
        tables.push(String(input).slice(String(input).lastIndexOf("/") + 1));
        return new Response("{}", { status: 201 });
      },
    },
  );
  assert.equal(wrote.ok, true);
  assert.deepEqual(tables, ["s2rb_valid_lookup", "s2rb_client_model"]);
});

test("missing Supabase config does not upload", async () => {
  const wrote = await recordValidLookup(
    { query: did, kind: "DID", handshake: "HIT", model: "s2rb" },
    { url: "", key: "" },
  );
  assert.equal(wrote.ok, false);
  if (wrote.ok) return;
  assert.equal(wrote.code, "NO_CLOUD");
  assert.equal(wrote.upload, false);
  assert.equal(wrote.rows?.lookup.query, did);
});
