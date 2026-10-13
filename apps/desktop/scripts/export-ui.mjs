#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const ui = join(root, "../ui");
const out = join(root, "../../s2rb/out");
mkdirSync(ui, { recursive: true });
if (!existsSync(out)) {
  console.log(JSON.stringify({ ok: true, copied: false, hint: "ui/ 已是桌面壳。先在 apps/s2rb 做静态导出再注入 out/。" }));
  process.exit(0);
}
cpSync(out, join(ui, "s2rb"), { recursive: true });
console.log(JSON.stringify({ ok: true, copied: true, dest: "ui/s2rb" }));
