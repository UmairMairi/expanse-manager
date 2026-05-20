import "server-only";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }
  client = new GoogleGenAI({ apiKey });
  return client;
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Default model — cheap, fast, supports tool calling. */
export const DEFAULT_MODEL = "gemini-2.5-flash";
/** Upgraded model for harder reasoning (smart categorization fallback, deep insights). */
export const REASONING_MODEL = "gemini-2.5-pro";
