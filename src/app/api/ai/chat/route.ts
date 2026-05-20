import { type NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/services/auth.service";
import { getGemini, isGeminiConfigured, DEFAULT_MODEL } from "@/ai/gemini";
import { buildTools } from "@/ai/tools";
import { incrementUsageOrThrow } from "@/ai/usage-guard";
import { logger } from "@/lib/logger";

interface IncomingMessage {
  role: "user" | "model";
  text: string;
}

interface Body {
  messages: IncomingMessage[];
}

const SYSTEM_INSTRUCTION = `You are a financial assistant inside the user's personal-finance app.
You have read-only tools to query their expenses, income, savings, budgets,
clients/projects/milestones, and outstanding invoices. ALWAYS use a tool when
the user's question references their data — never invent numbers. Format
amounts with the relevant currency code (PKR, USD, etc). Be concise and direct.
Today's date is ${new Date().toISOString().slice(0, 10)}.`;

export async function POST(req: NextRequest) {
  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured on the server" },
      { status: 500 },
    );
  }

  const user = await requireUser();
  try {
    await incrementUsageOrThrow(user.username);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "rate limited" },
      { status: 429 },
    );
  }

  const body = (await req.json()) as Body;
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const tools = buildTools();
  const genai = getGemini();

  const contents = body.messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  try {
    // Loop through tool calls until the model produces a final text response.
    // Max 6 tool-call rounds to avoid runaway agents.
    let response = await genai.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: tools.declarations }],
      },
    });

    for (let i = 0; i < 6; i++) {
      const calls = response.functionCalls ?? [];
      if (calls.length === 0) break;

      const toolResponses: Array<{
        functionResponse: { name: string; response: unknown };
      }> = [];
      for (const call of calls) {
        const handler = tools.handlers[call.name as string];
        if (!handler) {
          toolResponses.push({
            functionResponse: {
              name: call.name as string,
              response: { error: `unknown tool ${call.name}` },
            },
          });
          continue;
        }
        try {
          const result = await handler(call.args ?? {}, user.username);
          toolResponses.push({
            functionResponse: { name: call.name as string, response: result as object },
          });
        } catch (err) {
          toolResponses.push({
            functionResponse: {
              name: call.name as string,
              response: { error: err instanceof Error ? err.message : String(err) },
            },
          });
        }
      }

      contents.push({ role: "model", parts: calls.map((c) => ({ functionCall: c })) as never });
      contents.push({ role: "user", parts: toolResponses as never });

      response = await genai.models.generateContent({
        model: DEFAULT_MODEL,
        contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: tools.declarations }],
        },
      });
    }

    const text = response.text ?? "(no response)";
    return NextResponse.json({ text });
  } catch (err) {
    logger.error({ err }, "ai_chat_failed");
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 },
    );
  }
}
