import js from "@eslint/js";
import reactImport from "eslint-plugin-import";
import a11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-plugin-prettier";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  { ignores: ["dist", "node_modules", "eslint.config.ts"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        tsconfigRootDir: __dirname,
        project: ["./tsconfig.app.json", "./tsconfig.node.json", "./tsconfig.json"],
      },
    },
    settings: {
      react: { version: "detect" },
      "import/resolver": {
        alias: {
          map: [
            ["@", "./src"],
            ["@public/", "/"],
          ],
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },
    plugins: {
      react,
      "@typescript-eslint": tseslint.plugin,
      import: reactImport,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      prettier,
      "jsx-a11y": a11y,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommendedTypeChecked[0].rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,

      "react/prop-types": "off",
      "react/no-unstable-nested-components": "warn",
      "react/jsx-no-target-blank": "off",

      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always-and-inside-groups",
          alphabetize: { order: "asc", caseInsensitive: true },
          pathGroups: [
            {
              pattern: "@/**",
              group: "internal",
              position: "after",
            },
          ],
          pathGroupsExcludedImportTypes: ["builtin"],
          distinctGroup: true,
        },
      ],

      "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 0 }],

      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",

      "prettier/prettier": [
        "error",
        {
          singleQuote: false,
          semi: true,
          trailingComma: "all",
          printWidth: 80,
          endOfLine: "auto",
        },
      ],

      "no-restricted-imports": [
        "error",
        {
          patterns: ["../*", "//"],
          paths: [
            {
              name: "@public",
              message: "Use the `@public/` alias to access resources in `public`.",
            },
            {
              name: "@",
              message: "Use the `@` alias to access files in `src`.",
            },
          ],
        },
      ],
    },
  },
);
