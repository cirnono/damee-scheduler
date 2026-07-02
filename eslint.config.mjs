import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import unusedImports from "eslint-plugin-unused-imports";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

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
    ],
  },

  js.configs.recommended,

  ...compat.extends("next/core-web-vitals", "next/typescript"),

  ...tseslint.configs.recommendedTypeChecked,

  sonarjs.configs.recommended,

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
      complexity: ["error", { max: 12 }],
      "max-depth": ["error", 4],
      "max-nested-callbacks": ["error", 3],
      "max-params": ["warn", 4],
      "max-lines-per-function": [
        "warn",
        {
          max: 80,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
      "max-statements": ["warn", 35],

      /**
       * SonarJS 质量规则
       */
      "sonarjs/cognitive-complexity": ["warn", 15],
      "sonarjs/no-duplicate-string": [
        "warn",
        {
          threshold: 5,
        },
      ],

      /**
       * TypeScript 安全性 / 可维护性
       */
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-unnecessary-condition": "warn",
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
       * 基础安全写法
       */
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],
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
      "sonarjs/cognitive-complexity": ["warn", 25],
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
