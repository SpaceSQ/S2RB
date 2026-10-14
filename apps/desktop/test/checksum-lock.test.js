import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { assembleS2Did, screenDid } from "../../../packages/did/src/index.ts";

const here = dirname(fileURLToPath(import.meta.url));
const rust = readFileSync(join(here, "../src-tauri/src/did.rs"), "utf8");

test("desktop Rust fixtures stay locked to the official SPACSQ DID", () => {
  const valid = assembleS2Did("DHOME1251009", "00000001");
  assert.equal(valid, "DHOME1251009FA00000001");
  assert.equal(screenDid(valid).ok, true);
  assert.match(rust, /DHOME1251009FA00000001/);
  assert.match(rust, /screen_did\("DHOME1251009AB00000001"\)/);
  assert.match(rust, /3, 5, 7, 11, 13, 17, 19, 23, 29, 31/);
});
