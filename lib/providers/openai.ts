import OpenAI from "openai";
import type { ProviderResult } from "../types";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

function client(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

export async function askOpenAI(
  systemPrompt: string,
  userPrompt: string
): Promise<ProviderResult> {
  const start = Date.now();
  try {
    const openai = client();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7
    });
    const content = completion.choices[0]?.message?.content?.trim() ?? "";
    return {
      provider: "openai",
      model: MODEL,
      content,
      latencyMs: Date.now() - start,
      ok: true
    };
  } catch (err) {
    return {
      provider: "openai",
      model: MODEL,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
      ok: false
    };
  }
}
