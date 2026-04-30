import Anthropic from "@anthropic-ai/sdk";
import type { ProviderResult } from "../types";
import { approxTokens } from "./cost";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

export async function askAnthropic(
  systemPrompt: string,
  userPrompt: string,
  opts: { model?: string; maxTokens?: number; temperature?: number } = {}
): Promise<ProviderResult> {
  const start = Date.now();
  const model = opts.model || MODEL;
  try {
    const anthropic = client();
    const message = await anthropic.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 8192,
      temperature: opts.temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });
    const content = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();
    return {
      provider: "anthropic",
      model,
      content,
      latencyMs: Date.now() - start,
      ok: true,
      inputTokens: message.usage?.input_tokens ?? approxTokens(systemPrompt + userPrompt),
      outputTokens: message.usage?.output_tokens ?? approxTokens(content)
    };
  } catch (err) {
    return {
      provider: "anthropic",
      model,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
      ok: false
    };
  }
}
