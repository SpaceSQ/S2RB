const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);
config.watchFolders = [
  path.resolve(__dirname, "../../packages/did"),
  path.resolve(__dirname, "../web/vendor/spacsq"),
];

module.exports = config;
