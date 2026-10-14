import assert from "node:assert/strict";
import test from "node:test";
import { auditWithModel, modelTransportFromEnv, parseLlmAdvice, scanPublicPayload } from "../src/agent_scanner.ts";
import { assembleS2Did } from "../src/spacsq-seam.ts";

const valid = assembleS2Did("VAGENT251009", "00000021");
if (!valid) throw new Error("fixture");

test("model callback stays opt-in and never ships a key", async () => {
  assert.equal(scanPublicPayload({ did: "SHORT" }).ok, false);
  const missing = await auditWithModel({
    did: valid,
    publicKey: "pk",
    history: "none",
    grants: "space.read",
  });
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.code, "NO_MODEL");
  const dirty = await auditWithModel({
    did: "not-a-did",
    publicKey: "pk",
    history: "",
    grants: "",
    complete: async () => ({ ok: true, text: "{\"score\":1,\"connect\":\"ALLOW\",\"notes\":\"x\"}" }),
  });
  assert.equal(dirty.ok, false);
  if (!dirty.ok) assert.equal(dirty.code, "LOCAL_REJECT");
  const judged = await auditWithModel({
    did: valid,
    publicKey: "pk",
    history: "office",
    grants: "space.read",
    complete: async () => ({ ok: true, text: JSON.stringify({ score: 120, connect: "DENY", notes: "local" }) }),
  });
  assert.equal(judged.ok, true);
  if (!judged.ok) return;
  assert.equal(judged.report.connect, "DENY");
  assert.equal(judged.report.score, 100);
  const parsed = parseLlmAdvice("not-json");
  assert.equal(parsed, null);
  let sent = "";
  const transport = modelTransportFromEnv(
    { S2_AUDIT_COMPLETE_URL: "https://caller.example/complete", S2_AUDIT_COMPLETE_TOKEN: "caller-token" },
    async (url, init) => {
      sent = JSON.stringify({ url, headers: init?.headers, body: init?.body });
      return new Response(JSON.stringify({ score: 10, connect: "ALLOW", notes: "ok" }), { status: 200 });
    },
  );
  assert.ok(transport);
  const remote = await transport("prompt");
  assert.equal(remote.ok, true);
  assert.match(sent, /caller.example/);
  assert.match(sent, /Bearer caller-token/);
  assert.equal(modelTransportFromEnv({}), null);
});
