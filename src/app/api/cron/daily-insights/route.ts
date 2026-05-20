import { NextResponse, type NextRequest } from "next/server";
import { withCronSecret } from "@/lib/with-cron-secret";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { generateInsightsForUser } from "@/ai/insights";
import { logger } from "@/lib/logger";

export const GET = withCronSecret(async (_req: NextRequest) => {
  const usersSnap = await getDb().collection(COLLECTIONS.USERS).get();
  const results: Array<{ user: string; count: number | null }> = [];

  for (const doc of usersSnap.docs) {
    const username = doc.id;
    try {
      const result = await generateInsightsForUser(username);
      results.push({ user: username, count: result?.insights.length ?? null });
    } catch (err) {
      logger.error({ err, user: username }, "insights_cron_user_failed");
      results.push({ user: username, count: null });
    }
  }
  return NextResponse.json({ results });
});
