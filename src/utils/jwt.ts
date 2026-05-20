import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const SESSION_COOKIE = "session";
const TOKEN_TTL = "7d";

export type SessionClaims = JWTPayload & {
  sub: string; // username
  role: "admin";
  name: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be set and at least 32 characters. Generate with: openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(claims: Omit<SessionClaims, "iat" | "exp">): Promise<string> {
  return new SignJWT(claims as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string") return null;
    return payload as SessionClaims;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

export const SESSION_COOKIE_OPTIONS = {
  name: SESSION_COOKIE,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days, matches TOKEN_TTL
};
