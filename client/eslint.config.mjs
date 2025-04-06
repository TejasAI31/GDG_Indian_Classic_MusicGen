import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Base ESLint + TypeScript recommended rules
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Next.js defaults (core-web-vitals + TypeScript)
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Your custom rules
  {
    rules: {
      // Disable unused variable warnings
      "@typescript-eslint/no-unused-vars": "off",
      
      // Disable explicit `any` warnings
      "@typescript-eslint/no-explicit-any": "off",
      
      // Allow `<img>` tags (disable Next.js Image enforcement)
      "@next/next/no-img-element": "off",
      
      // Downgrade React Hook missing deps to warnings
      "react-hooks/exhaustive-deps": "warn",
      
      // Disable unescaped entities warnings in JSX
      "react/no-unescaped-entities": "off",
      
      // Enforce `const` over `let` where possible
      "prefer-const": "error",
    },
  },
];