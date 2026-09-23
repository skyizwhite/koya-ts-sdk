import { defineConfig } from "orval";

export default defineConfig({
  koya: {
    input: { target: "./openapi/koya.yaml" },
    output: {
      target: "./src/generated/koya.ts",
      mode: "single",
      client: "fetch",
      tsconfig: "./tsconfig.json",
      override: {
        header: false,
        mutator: { path: "./src/http.ts", name: "koyaFetch" },
        fetch: { includeHttpResponseReturnType: false },
      },
    },
  },
});
