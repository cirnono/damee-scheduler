import js from "@eslint/js";
import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";

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

    ...tseslint.configs.recommended,

    {
        plugins: {
            "@next/next": nextPlugin,
            "react-hooks": reactHooks,
        },
        rules: {
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs["core-web-vitals"].rules,
            "react-hooks/rules-of-hooks": "off",
            "react-hooks/exhaustive-deps": "off",
        },
    },

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
