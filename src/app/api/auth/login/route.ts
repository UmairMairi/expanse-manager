import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/services/auth.service";
import { SESSION_COOKIE_OPTIONS } from "@/utils/jwt";
import { logger } from "@/lib/logger";

const LoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(256),
});

function getIpKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input" },
      { status: 400 },
    );
  }

  const ipKey = getIpKey(req);
  const result = await authenticate(parsed.data.username, parsed.data.password, ipKey);

  if (!result.ok) {
    logger.info({ kind: result.error.kind, ipKey }, "Login failed");
    const status =
      result.error.kind === "rate_limited" ? 429 :
      result.error.kind === "unauthorized" ? 401 :
      500;
    const headers: HeadersInit = {};
    if (result.error.kind === "rate_limited" && result.error.retryAfterSeconds) {
      headers["Retry-After"] = String(result.error.retryAfterSeconds);
    }
    return NextResponse.json({ error: result.error.message }, { status, headers });
  }

  const res = NextResponse.json({ user: result.data.user });
  res.cookies.set({
    ...SESSION_COOKIE_OPTIONS,
    value: result.data.token,
  });
  logger.info({ username: result.data.user.username }, "Login success");
  return res;
}
