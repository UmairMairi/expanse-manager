import "server-only";
import { Type } from "@google/genai";
import { getGemini, DEFAULT_MODEL, isGeminiConfigured } from "@/ai/gemini";
import { listExpenses } from "@/services/expenses.service";
import { logger } from "@/lib/logger";

const DEFAULT_CATEGORIES = [
  "Food",
  "Rent",
  "Utilities",
  "Internet",
  "Travel",
  "Shopping",
  "Entertainment",
  "Health",
  "Investments",
  "Education",
  "Family",
  "Miscellaneous",
];

/**
 * Suggest a category for an expense based on its title + notes, using recent
 * labeled examples from the user's own history as few-shot context.
 * Returns null on any failure (caller falls back to the default category).
 */
export async function suggestCategory(args: {
  userId: string;
  title: string;
  notes?: string;
}): Promise<string | null> {
  if (!isGeminiConfigured()) return null;

  const recent = await listExpenses(args.userId, { limit: 20 });
  const labeled = recent.filter((r) => r.category && r.title);
  const examples = labeled
    .slice(0, 10)
    .map((r) => `- "${r.title}" → ${r.category}`)
    .join("\n");

  const categoryList = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...labeled.map((r) => r.category)]),
  );

  const prompt = `Pick the best category for this expense from the allowed list.
Allowed categories: ${categoryList.join(", ")}.
${examples ? `\nRecent labeled expenses (user's own):\n${examples}\n` : ""}
New expense:
- Title: ${args.title}
${args.notes ? `- Notes: ${args.notes}` : ""}

Reply with only the chosen category name.`;

  try {
    const res = await getGemini().models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: categoryList },
          },
          required: ["category"],
        },
      },
    });
    const text = res.text?.trim();
    if (!text) return null;
    const parsed = JSON.parse(text) as { category: string };
    if (categoryList.includes(parsed.category)) return parsed.category;
    return null;
  } catch (err) {
    logger.warn({ err }, "categorize_failed");
    return null;
  }
}
