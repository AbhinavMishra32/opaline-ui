import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  agentRules: false,
  reactStrictMode: true,
  transpilePackages: ["@opaline/ui"],
  turbopack: { root: repoRoot },
  webpack(webpackConfig) {
    webpackConfig.resolve.alias["@opaline/ui"] = path.join(repoRoot, "packages/ui/src/index.ts");
    return webpackConfig;
  },
};

export default withMDX(config);
