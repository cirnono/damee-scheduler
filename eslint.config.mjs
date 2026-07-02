import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import unusedImports from "eslint-plugin-unused-imports";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "out/**",
      ".turbo/**",
      "next-env.d.ts",
      "eslint.config.mjs",
      "postcss.config.mjs",
    ],
  },

  js.configs.recommended,

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  ...tseslint.configs.recommended,
  ...tseslint.configs.stylistic,

  sonarjs.configs.recommended,

  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: ["**/*.{ts,tsx}"],
  })),

  {
    plugins: {
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
    },
  },

  {
    files: ["**/*.{ts,tsx}"],

    plugins: {
      "unused-imports": unusedImports,
    },

    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      /**
       * 复杂度控制
       */
      complexity: "off",
      "max-depth": ["warn", 6],
      "max-nested-callbacks": ["warn", 5],
      "max-params": "off",
      "max-lines-per-function": "off",
      "max-statements": ["warn", 80],

      /**
       * SonarJS 质量规则
       */
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-duplicate-string": "off",

      /**
       * TypeScript 安全性 / 可维护性
       */
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unused-vars": "off",

      /**
       * import 清理
       */
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      /**
       * 样式/规范类 — 对既有代码放宽
       */
      "@typescript-eslint/consistent-type-definitions": "off",
      "sonarjs/no-nested-conditional": "off",
      "sonarjs/prefer-read-only-props": "off",
      "sonarjs/no-nested-template-literals": "off",
      "sonarjs/todo-tag": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/use-type-alias": "off",

      /**
       * 基础安全写法
       */
      "no-console": "off",
      "no-alert": "error",
      "no-debugger": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-return-await": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],

      /**
       * React / Next 常见容忍项
       */
      "react/display-name": "off",
    },
  },

  /**
   * Next.js route / page / layout 文件经常天然偏长，先放宽。
   */
  {
    files: [
      "app/**/page.tsx",
      "app/**/layout.tsx",
      "app/**/route.ts",
      "app/**/loading.tsx",
      "app/**/error.tsx",
      "app/**/not-found.tsx",
    ],
    rules: {
      "max-lines-per-function": "off",
      "max-statements": "off",
      "sonarjs/cognitive-complexity": "off",
    },
  },

  /**
   * 测试文件放宽一点，不然测试代码会被规则卡得很烦。
   */
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "tests/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "max-lines-per-function": "off",
      "sonarjs/no-duplicate-string": "off",
    },
  },

  /**
   * 配置文件通常需要 CommonJS / Node 风格，放宽。
   */
  {
    files: [
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "next.config.ts",
      "postcss.config.mjs",
      "tailwind.config.ts",
    ],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "sonarjs/no-duplicate-string": "off",
    },
  },
);
