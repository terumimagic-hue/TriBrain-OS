import OpenAI from "openai";
import type { ProviderResult } from "../types";
import { approxTokens } from "./cost";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";

function client(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

export async function askOpenAI(
  systemPrompt: string,
  userPrompt: string,
  opts: { model?: string; temperature?: number; maxTokens?: number } = {}
): Promise<ProviderResult> {
  const start = Date.now();
  const model = opts.model || MODEL;
  try {
    const openai = client();
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens
    });
    const content = completion.choices[0]?.message?.content?.trim() ?? "";
    return {
      provider: "openai",
      model,
      content,
      latencyMs: Date.now() - start,
      ok: true,
      inputTokens: completion.usage?.prompt_tokens ?? approxTokens(systemPrompt + userPrompt),
      outputTokens: completion.usage?.completion_tokens ?? approxTokens(content)
    };
  } catch (err) {
    return {
      provider: "openai",
      model,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
      ok: false
    };
  }
}

export async function embedOpenAI(text: string): Promise<{ vector: number[]; model: string; tokens: number } | null> {
  try {
    const openai = client();
    const r = await openai.embeddings.create({ model: EMBED_MODEL, input: text });
    return {
      vector: r.data[0].embedding,
      model: EMBED_MODEL,
      tokens: r.usage?.total_tokens ?? approxTokens(text)
    };
  } catch {
    return null;
  }
}
