import "server-only";
import { Type } from "@google/genai";
import { Timestamp } from "firebase-admin/firestore";
import { getGemini, DEFAULT_MODEL, isGeminiConfigured } from "@/ai/gemini";
import { getDb } from "@/firebase/admin";
import { COLLECTIONS } from "@/firebase/schema";
import { listExpenses } from "@/services/expenses.service";
import { listIncome } from "@/services/income.service";
import { getBudgetStatuses } from "@/services/budgets.service";
import { logger } from "@/lib/logger";

export interface Insight {
  headline: string;
  detail: string;
  tone: "positive" | "warning" | "neutral";
}

export interface InsightsDoc {
  id: string;
  userId: string;
  generatedAt: string;
  insights: Insight[];
}

function dayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function getCachedInsights(
  userId: string,
  day: string = dayKey(),
): Promise<InsightsDoc | null> {
  const id = `${userId}_${day}`;
  const snap = await getDb().collection(COLLECTIONS.INSIGHTS).doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (!data) return null;
  return {
    id,
    userId,
    generatedAt: (data.generatedAt as Timestamp).toDate().toISOString(),
    insights: data.insights as Insight[],
  };
}

/**
 * Compute period-over-period aggregates, then ask Gemini to surface 3–5
 * short bullet insights. Stored once per UTC day per user.
 */
export async function generateInsightsForUser(userId: string): Promise<InsightsDoc | null> {
  if (!isGeminiConfigured()) return null;

  const now = new Date();
  const thirtyDays = 30 * 86_400_000;
  const sixtyDays = 60 * 86_400_000;

  const [thisMonthExp, prevMonthExp, thisMonthInc, prevMonthInc, budgets] = await Promise.all([
    listExpenses(userId, { from: new Date(now.getTime() - thirtyDays), to: now }),
    listExpenses(userId, {
      from: new Date(now.getTime() - sixtyDays),
      to: new Date(now.getTime() - thirtyDays),
    }),
    listIncome(userId, { from: new Date(now.getTime() - thirtyDays), to: now }),
    listIncome(userId, {
      from: new Date(now.getTime() - sixtyDays),
      to: new Date(now.getTime() - thirtyDays),
    }),
    getBudgetStatuses(userId),
  ]);

  const sum = (rows: Array<{ amount: number; currency: string }>) =>
    rows.reduce((acc, r) => {
      acc[r.currency] = (acc[r.currency] ?? 0) + r.amount;
      return acc;
    }, {} as Record<string, number>);

  const byCat = (rows: Array<{ amount: number; category: string }>) =>
    rows.reduce((acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + r.amount;
      return acc;
    }, {} as Record<string, number>);

  const aggregates = {
    last30: {
      expensesByCurrency: sum(thisMonthExp),
      expensesByCategory: byCat(thisMonthExp),
      incomeByCurrency: sum(thisMonthInc),
    },
    prev30: {
      expensesByCurrency: sum(prevMonthExp),
      expensesByCategory: byCat(prevMonthExp),
      incomeByCurrency: sum(prevMonthInc),
    },
    budgets: budgets
      .filter((b) => b.state !== "ok")
      .map((b) => ({
        category: b.budget.category,
        currency: b.budget.currency,
        percent: Math.round(b.percentUsed),
        state: b.state,
      })),
  };

  // All amounts above are in minor units; instruct the model to convert.
  const prompt = `You are reviewing the user's personal financial data.
Aggregates (amounts are in minor currency units — divide by 100 for major).
${JSON.stringify(aggregates, null, 2)}

Generate 3 to 5 short, specific insights. Each must:
- Be ≤ 18 words in the headline
- Cite a concrete number when relevant (in major units, with currency)
- Set tone to "warning" for over-budget or large negative deltas, "positive"
  for income growth or under-budget categories, "neutral" otherwise

If there is not enough data, return an empty array.`;

  try {
    const res = await getGemini().models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING },
                  detail: { type: Type.STRING },
                  tone: {
                    type: Type.STRING,
                    enum: ["positive", "warning", "neutral"],
                  },
                },
                required: ["headline", "detail", "tone"],
              },
            },
          },
          required: ["insights"],
        },
      },
    });

    const text = res.text?.trim();
    if (!text) return null;
    const parsed = JSON.parse(text) as { insights: Insight[] };
    const day = dayKey();
    const docId = `${userId}_${day}`;
    await getDb()
      .collection(COLLECTIONS.INSIGHTS)
      .doc(docId)
      .set({
        userId,
        day,
        generatedAt: Timestamp.now(),
        insights: parsed.insights,
      });
    return {
      id: docId,
      userId,
      generatedAt: new Date().toISOString(),
      insights: parsed.insights,
    };
  } catch (err) {
    logger.error({ err, userId }, "insights_generation_failed");
    return null;
  }
}
