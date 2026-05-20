import { NextResponse, type NextRequest } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Guards a cron route handler so it only runs when invoked with the
 * `Authorization: Bearer ${CRON_SECRET}` header set by Vercel Cron.
 * Returns 401 to any unauthorized caller.
 */
export function withCronSecret(
  handler: (req: NextRequest) => Promise<NextResponse | Response>,
): (req: NextRequest) => Promise<NextResponse | Response> {
  return async (req) => {
    const expected = process.env.CRON_SECRET;
    if (!expected) {
      logger.error({}, "cron_secret_not_configured");
      return NextResponse.json(
        { error: "CRON_SECRET not configured on the server" },
        { status: 500 },
      );
    }
    const got = req.headers.get("authorization");
    if (got !== `Bearer ${expected}`) {
      logger.warn({ path: req.nextUrl.pathname }, "cron_unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(req);
  };
}
