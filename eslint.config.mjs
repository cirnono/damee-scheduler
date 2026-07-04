import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";

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

    ...tseslint.configs.recommended,

    {
        files: ["**/*.{ts,tsx,js,jsx}"],

        plugins: {
            security,
        },

        rules: {
            /**
             * 高置信度危险写法：直接失败
             */
            "no-eval": "error",
            "no-implied-eval": "error",
            "no-new-func": "error",
            "no-script-url": "error",
            "no-debugger": "error",

            /**
             * 安全热点：先 warning，不阻止 CI
             * 因为这些规则可能有假阳性。
             */
            "security/detect-eval-with-expression": "warn",
            "security/detect-new-buffer": "warn",
            "security/detect-no-csrf-before-method-override": "warn",
            "security/detect-non-literal-fs-filename": "warn",
            "security/detect-non-literal-regexp": "warn",
            "security/detect-non-literal-require": "warn",
            "security/detect-object-injection": "warn",
            "security/detect-possible-timing-attacks": "warn",
            "security/detect-pseudoRandomBytes": "warn",
            "security/detect-unsafe-regex": "warn",

            /**
             * 不要太严格，先让项目能推进。
             */
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "no-console": "off",
            "react/display-name": "off",
        },
    },

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
        },
    },
);
