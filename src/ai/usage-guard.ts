import "server-only";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Cost guard: cap how many AI requests a user can make per UTC day so a runaway
 * loop can't drain credits. Stored as `aiUsage/{userId}_{YYYY-MM-DD}`.
 */
const DAILY_REQUEST_CAP = 200;

function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function incrementUsageOrThrow(userId: string): Promise<void> {
  const day = dayKey();
  const id = `${userId}_${day}`;
  const ref = getDb().collection(COLLECTIONS.AI_USAGE).doc(id);
  await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = (snap.exists ? (snap.data()?.count as number | undefined) : 0) ?? 0;
    if (current >= DAILY_REQUEST_CAP) {
      throw new Error(
        `Daily AI request cap reached (${DAILY_REQUEST_CAP}). Try again tomorrow.`,
      );
    }
    tx.set(
      ref,
      {
        userId,
        day,
        count: current + 1,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
  });
}
