import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],

    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],

      include: [
        "app/**/*.{ts,tsx}",
        "components/**/*.{ts,tsx}",
        "features/**/*.{ts,tsx}",
        "lib/**/*.{ts,tsx}",
        "server/**/*.{ts,tsx}",
      ],

      exclude: [
        "**/*.d.ts",
        "**/*.config.*",
        "**/next.config.*",
        "**/vitest.config.*",
        "**/middleware.ts",
        "**/layout.tsx",
        "**/page.tsx",
        "**/loading.tsx",
        "**/error.tsx",
        "**/not-found.tsx",
        "**/route.ts",
        "**/node_modules/**",
        "**/.next/**",
        "**/coverage/**",
      ],

      thresholds: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
    },
  },
});
