import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

/**
 * Single project-wide logger. Console output in dev, structured JSON in prod
 * (Vercel ingests JSON automatically). Use in services, route handlers, and
 * server actions — never `console.log` directly.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  base: { service: "expense-manager" },
  ...(isProd
    ? {}
    : {
        // Pretty-printing in dev requires pino-pretty; fall back to default if absent.
        transport: undefined,
      }),
});

export type Logger = typeof logger;
