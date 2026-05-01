import OpenAI from "openai";
import type { ProviderResult } from "../types";
import { approxTokens } from "./cost";
import { resolveEnv } from "../db/state";

function defaults() {
  const env = resolveEnv();
  return { model: env.openaiModel, embedModel: env.embeddingModel, apiKey: env.openaiKey };
}

function client(): OpenAI {
  const { apiKey } = defaults();
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set (Settings or .env)");
  return new OpenAI({ apiKey });
}

export async function askOpenAI(
  systemPrompt: string,
  userPrompt: string,
  opts: { model?: string; temperature?: number; maxTokens?: number } = {}
): Promise<ProviderResult> {
  const start = Date.now();
  const model = opts.model || defaults().model;
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
    const m = defaults().embedModel;
    const r = await openai.embeddings.create({ model: m, input: text });
    return {
      vector: r.data[0].embedding,
      model: m,
      tokens: r.usage?.total_tokens ?? approxTokens(text)
    };
  } catch {
    return null;
  }
}

export function openaiClientForImages(): OpenAI {
  return client();
}
