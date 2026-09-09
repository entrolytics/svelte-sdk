import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  fixedExtension: false,
  dts: false,
  clean: true,
  sourcemap: true,
  treeshake: true,
  minify: false,
  deps: { neverBundle: ['svelte'] },
});
