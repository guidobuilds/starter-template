import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/lib/api/users.ts", "src/lib/api/settings.ts", "src/app/api/register/route.ts", "src/app/api/settings/route.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 50,
        statements: 80,
      },
    },
  },
})
