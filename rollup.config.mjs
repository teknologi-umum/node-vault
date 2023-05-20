import ts from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.cjs",
      format: "cjs",
      sourcemap: true
    },
    {
      file: "dist/index.mjs",
      format: "es",
      sourcemap: true
    },
    {
      file: "dist/index.iife.js",
      format: "iife",
      extend: true,
      name: "node-vault",
      plugins: [terser()],
      sourcemap: true
    }
  ],
  plugins: [ts({tsconfig: "./tsconfig.json"})]
};