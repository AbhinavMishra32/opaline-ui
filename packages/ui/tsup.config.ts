import { defineConfig } from "tsup"

export default defineConfig({
  entry: { index: "src/index.ts", thread: "src/thread/index.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  external: ["react", "react-dom"],
  banner: { js: '"use client";' },
})
