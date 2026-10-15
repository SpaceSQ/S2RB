import assert from "node:assert/strict";
import test from "node:test";
import { FUTURE_EXTENSIONS } from "../../../packages/mcp/src/partners.ts";
import {
  S2AIOS_HOME,
  S2AIOS_REPO,
  S2RB_FREE_NOTICE,
  S2RB_FREE_NOTICE_EN,
  S2RB_HOME,
  S2RB_REPO,
  S2RB_SERIES,
} from "../src/config.ts";
import { COPY, DEFAULT_LOCALE, EN, EXT_EN, PUBLIC_NAV, ZH } from "../src/site_copy.ts";

test("default locale is English and both dictionaries share keys", () => {
  assert.equal(DEFAULT_LOCALE, "en");
  const enKeys = Object.keys(EN).sort();
  const zhKeys = Object.keys(ZH).sort();
  assert.deepEqual(enKeys, zhKeys);
  assert.equal(COPY.en["nav.resolve"], "Resolve");
  assert.equal(COPY.zh["nav.resolve"], "解析");
});

test("free-use notice is hardcoded in both languages", () => {
  assert.equal(S2RB_FREE_NOTICE, "S2RB 仅限个人免费使用，严禁商用、打包及修改后二次销售");
  assert.equal(
    S2RB_FREE_NOTICE_EN,
    "S2RB is free for personal use only. Commercial use, repackaging, and resale of modified copies are forbidden.",
  );
});

test("official desk stamps series, home, repo, and documented S2 AIOS URL", () => {
  assert.equal(S2RB_SERIES, "S2-NF-001");
  assert.equal(S2RB_HOME, "https://s2rb.space2.world");
  assert.equal(S2RB_REPO, "https://github.com/SpaceSQ/S2RB");
  assert.equal(S2AIOS_HOME, "https://s2aios.space2.world");
  assert.equal(S2AIOS_REPO, "https://github.com/SpaceSQ/S2AIOS");
  assert.match(EN["aios.midBody"], /does not replace S2 AIOS/);
  assert.match(ZH["aios.midBody"], /不替代 S2 AIOS/);
  assert.equal(EN["footer.aios"], "S2 AIOS");
  assert.equal(ZH["footer.aios"], "S2 AIOS");
  assert.deepEqual(PUBLIC_NAV.map((item) => item.href), ["/", "/sandbox", "/host", "/about", "/notice"]);
});

test("four WIRED partner lanes have English desk copy", () => {
  assert.equal(FUTURE_EXTENSIONS.length, 4);
  for (const lane of FUTURE_EXTENSIONS) {
    assert.equal(lane.status, "WIRED");
    const en = EXT_EN[lane.id];
    assert.ok(en, lane.id);
    assert.ok(en.title.length > 8);
    assert.equal(en.actions.length, lane.actions.length);
  }
});
