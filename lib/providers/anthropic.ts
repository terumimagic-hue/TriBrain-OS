import Anthropic from "@anthropic-ai/sdk";
import type { ProviderResult } from "../types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

export async function askAnthropic(
  systemPrompt: string,
  userPrompt: string
): Promise<ProviderResult> {
  const start = Date.now();
  try {
    const anthropic = client();
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });
    const content = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n")
      .trim();
    return {
      provider: "anthropic",
      model: MODEL,
      content,
      latencyMs: Date.now() - start,
      ok: true
    };
  } catch (err) {
    return {
      provider: "anthropic",
      model: MODEL,
      error: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
      ok: false
    };
  }
}
