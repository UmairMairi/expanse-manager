import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { Timestamp } from "firebase-admin/firestore";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import {
  type Result,
  err,
  ok,
  notFound,
  unauthorized,
  rateLimited,
  internal,
} from "@/lib/errors";
import {
  SESSION_COOKIE_NAME,
  signSession,
  verifySession,
  type SessionClaims,
} from "@/utils/jwt";

const BCRYPT_COST = 12;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

export type StoredUser = {
  username: string;
  passwordHash: string;
  name: string;
  email: string;
  role: "admin";
  createdAt: Timestamp;
  lastLogin?: Timestamp;
};

export type AuthedUser = {
  username: string;
  name: string;
  email: string;
  role: "admin";
};

/** Hash a password with bcrypt (cost 12). */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

/**
 * Server-side current-user accessor for Server Components, Server Actions,
 * and route handlers. Returns null if no session — caller decides whether
 * to redirect or 401.
 */
export async function getCurrentUser(): Promise<AuthedUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const claims = await verifySession(token);
  if (!claims) return null;
  return {
    username: claims.sub,
    name: claims.name,
    email: (claims["email"] as string | undefined) ?? "",
    role: claims.role,
  };
}

/** Same as getCurrentUser but throws on missing session — use after middleware. */
export async function requireUser(): Promise<AuthedUser> {
  const u = await getCurrentUser();
  if (!u) throw unauthorized();
  return u;
}

async function checkRateLimit(ipKey: string): Promise<Result<true>> {
  const db = getDb();
  const ref = db.collection(COLLECTIONS.LOGIN_ATTEMPTS).doc(ipKey);
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data() as { attempts?: number[] } | undefined;
    const recent = (data?.attempts ?? []).filter((t) => t > cutoff);
    if (recent.length >= RATE_LIMIT_MAX_ATTEMPTS) {
      const retryAfter = Math.ceil((recent[0]! + RATE_LIMIT_WINDOW_MS - now) / 1000);
      return err(rateLimited(retryAfter));
    }
    tx.set(ref, { attempts: [...recent, now] });
    return ok(true);
  });
}

async function clearRateLimit(ipKey: string): Promise<void> {
  await getDb().collection(COLLECTIONS.LOGIN_ATTEMPTS).doc(ipKey).delete().catch(() => undefined);
}

export async function authenticate(
  username: string,
  password: string,
  ipKey: string,
): Promise<Result<{ token: string; user: AuthedUser }>> {
  const rl = await checkRateLimit(ipKey);
  if (!rl.ok) return rl;

  const db = getDb();
  const userRef = db.collection(COLLECTIONS.USERS).doc(username);
  let snap;
  try {
    snap = await userRef.get();
  } catch (e) {
    return err(internal(e instanceof Error ? e.message : "Firestore unavailable"));
  }
  if (!snap.exists) {
    // Use generic message — don't leak whether the username exists.
    return err(unauthorized("Invalid username or password"));
  }
  const stored = snap.data() as StoredUser;
  const matches = await bcrypt.compare(password, stored.passwordHash);
  if (!matches) {
    return err(unauthorized("Invalid username or password"));
  }

  await clearRateLimit(ipKey);
  await userRef.update({ lastLogin: Timestamp.now() });

  const token = await signSession({
    sub: stored.username,
    role: stored.role,
    name: stored.name,
    email: stored.email,
  } as SessionClaims);

  return ok({
    token,
    user: {
      username: stored.username,
      name: stored.name,
      email: stored.email,
      role: stored.role,
    },
  });
}

export async function findUser(username: string): Promise<StoredUser | null> {
  const snap = await getDb().collection(COLLECTIONS.USERS).doc(username).get();
  return snap.exists ? (snap.data() as StoredUser) : null;
}

export async function createUser(
  user: Omit<StoredUser, "createdAt" | "lastLogin"> & { plainPassword?: never },
  options: { force?: boolean } = {},
): Promise<Result<StoredUser>> {
  const ref = getDb().collection(COLLECTIONS.USERS).doc(user.username);
  const existing = await ref.get();
  if (existing.exists && !options.force) {
    return err(notFound("create-user")); // re-purpose to signal conflict via business rule below
  }
  const doc: StoredUser = {
    ...user,
    createdAt: Timestamp.now(),
  };
  await ref.set(doc);
  return ok(doc);
}
