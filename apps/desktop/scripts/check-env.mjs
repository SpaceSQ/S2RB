#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function has(bin) {
  const result = spawnSync(bin, ["--version"], { encoding: "utf8" });
  return result.status === 0 ? (result.stdout || result.stderr).trim().split("\n")[0] : "";
}

const node = process.versions.node;
const rustc = has("rustc");
const cargo = has("cargo");
const ok = Boolean(rustc && cargo);
const windows = process.platform === "win32";
const report = {
  ok,
  node,
  rustc: rustc || null,
  cargo: cargo || null,
  webview2: windows
    ? "Windows 打包需要 Edge WebView2。Tauri 会弹出官方引导下载，不要跳过。"
    : "当前不是 Windows，WebView2 引导不会出现。",
  hint: ok
    ? "桌面端可以执行 npm run dev / npm run build:dmg / npm run build:exe。"
    : "先安装 Rust 工具链（rustup）和 Node.js，再打包 .dmg / .exe。",
};
console.log(JSON.stringify(report, null, 2));
if (!ok) process.exitCode = 2;
