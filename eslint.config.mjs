import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslint from 'eslint';

const { defineConfig } = eslint;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Merge older extends with modern flat configuration
const legacyExtends = compat.extends("next/core-web-vitals", "next/typescript");

export default defineConfig({
  extends: [
    ...legacyExtends,
    'next',
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off'
  }
});
