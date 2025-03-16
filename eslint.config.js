import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import { FlatCompat } from "@eslint/eslintrc";
import sapphire from "@sapphire/eslint-config";
const compat = new FlatCompat();
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...compat.config(sapphire),
];
