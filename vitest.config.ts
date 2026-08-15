import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Unit tests cover the pure logic modules only — permission resolution, the
 * expense query parser and the headcount trend maths. Everything else in this
 * codebase is UI wiring over demo data, which is verified by running the app.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
