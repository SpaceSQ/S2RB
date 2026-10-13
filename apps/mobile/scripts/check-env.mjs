#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function has(bin, args = ["--version"]) {
  const result = spawnSync(bin, args, { encoding: "utf8" });
  return result.status === 0 ? (result.stdout || result.stderr).trim().split("\n")[0] : "";
}

const node = process.versions.node;
const eas = has("eas") || has("npx", ["eas", "--version"]);
const xcode = process.platform === "darwin" ? Boolean(has("xcodebuild", ["-version"])) : false;
const report = {
  ok: Boolean(eas),
  node,
  eas: eas || null,
  apk: "Android .apk 走 eas build -p android --profile production，本地或 Expo 云都可以。",
  ios: xcode
    ? "本机有 Xcode，也可以本地归档。云打包同样可用。"
    : "iOS 包需要 macOS + Xcode，或 Expo 云打包。",
  hint: eas
    ? "可以执行 npm run build:apk。"
    : "先安装 eas-cli：npm i -g eas-cli，然后 eas login。",
};
console.log(JSON.stringify(report, null, 2));
if (!eas) process.exitCode = 2;
