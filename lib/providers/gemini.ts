import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProviderResult } from "../types";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function client(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(apiKey);
}

export async function askGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<ProviderResult> {
  const start = Date.now();
  try {
    const genAI = client();
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt
    });
    const result = await model.generateContent(userPrompt);
    const content = result.response.text().trim();
    return {
      provider: "gemini",
      model: MODEL,
      content,
      latencyMs: Date.now() - start,
      ok: true
    };
  } catch (err) {
    return {
      provider: "gemini",
      model: MODEL,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
      ok: false
    };
  }
}
