import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Convert legacy configs using FlatCompat
const legacyConfigs = compat.config({
  extends: [
    'next',
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ]
});

export default [
  ...legacyConfigs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
];
