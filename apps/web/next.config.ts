import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@modelcontextprotocol/sdk"],
  webpack: (config, { dir }) => {
    // Vercel installs with Root Directory apps/web. Imports in packages/mcp
    // are outside that tree, so webpack's node_modules walk never sees
    // apps/web/node_modules (where zod is installed).
    const appModules = path.join(dir, "node_modules");
    const modules = config.resolve.modules ?? ["node_modules"];
    if (!modules.includes(appModules)) {
      config.resolve.modules = [appModules, ...modules];
    }
    return config;
  },
};

export default nextConfig;
