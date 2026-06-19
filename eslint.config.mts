import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/indent": ["error", 4],
      "@stylistic/quotes": ["error", "single"],
      "@stylistic/linebreak-style": ["error", "unix"],
      "@stylistic/semi": ["error", "always"],
    },
  },
]);