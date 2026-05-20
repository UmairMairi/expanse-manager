import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

/** Hash a password with bcrypt (cost 12). Safe to call from any context. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

/** Verify a plain password against a stored bcrypt hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
