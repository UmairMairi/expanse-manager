import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { import: importPlugin },
    rules: {
      // Layering: lower layers may not import from higher layers.
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            // services/ may not import from features/ or app/
            {
              target: "./src/services",
              from: "./src/features",
              message:
                "services/ is a lower layer; features/ should import services/, not the other way around.",
            },
            {
              target: "./src/services",
              from: "./src/app",
              message:
                "services/ is a lower layer; do not import from app/.",
            },
            // lib/ may not import from features/, services/, or app/
            {
              target: "./src/lib",
              from: "./src/features",
              message: "lib/ is infrastructure; do not import from features/.",
            },
            {
              target: "./src/lib",
              from: "./src/services",
              message: "lib/ is infrastructure; do not import from services/.",
            },
            {
              target: "./src/lib",
              from: "./src/app",
              message: "lib/ is infrastructure; do not import from app/.",
            },
          ],
        },
      ],
      // No console.log in committed code (logger.ts is the exception).
      "no-console": [
        "warn",
        { allow: ["warn", "error"] },
      ],
    },
  },
  {
    files: ["src/lib/logger.ts", "scripts/**/*.{ts,js}", "**/*.test.{ts,tsx}"],
    rules: { "no-console": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
