import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProviderResult } from "../types";
import { approxTokens } from "./cost";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function client(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(apiKey);
}

export async function askGemini(
  systemPrompt: string,
  userPrompt: string,
  opts: { model?: string; temperature?: number } = {}
): Promise<ProviderResult> {
  const start = Date.now();
  const model = opts.model || MODEL;
  try {
    const genAI = client();
    const m = genAI.getGenerativeModel({
      model,
      systemInstruction: systemPrompt,
      generationConfig: opts.temperature != null ? { temperature: opts.temperature } : undefined
    });
    const result = await m.generateContent(userPrompt);
    const content = result.response.text().trim();
    const usage = result.response.usageMetadata;
    return {
      provider: "gemini",
      model,
      content,
      latencyMs: Date.now() - start,
      ok: true,
      inputTokens: usage?.promptTokenCount ?? approxTokens(systemPrompt + userPrompt),
      outputTokens: usage?.candidatesTokenCount ?? approxTokens(content)
    };
  } catch (err) {
    return {
      provider: "gemini",
      model,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
      ok: false
    };
  }
}
