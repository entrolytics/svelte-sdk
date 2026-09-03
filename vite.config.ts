import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/index.ts"],
    format: ["esm"],
    fixedExtension: false,
    dts: true,
    clean: true,
    sourcemap: true,
    treeshake: true,
    minify: false,
    deps: {
      neverBundle: ["svelte"],
    },
  },
  run: {
    cache: {
      scripts: true,
      tasks: true,
    },
  },
  staged: {
    "*.{ts,tsx,js,jsx,mjs,cjs,json,md,yml,yaml}": "vp check --fix",
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
