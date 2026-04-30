import type { ProviderId, ProviderResult } from "../types";
import { askOpenAI } from "./openai";
import { askAnthropic } from "./anthropic";
import { askGemini } from "./gemini";

export type ProviderFn = (
  systemPrompt: string,
  userPrompt: string
) => Promise<ProviderResult>;

export const PROVIDERS: Record<ProviderId, ProviderFn> = {
  openai: askOpenAI,
  anthropic: askAnthropic,
  gemini: askGemini
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  openai: "ChatGPT",
  anthropic: "Claude",
  gemini: "Gemini"
};

export async function askAll(
  systemPrompt: string,
  userPrompt: string
): Promise<ProviderResult[]> {
  return Promise.all(
    (Object.keys(PROVIDERS) as ProviderId[]).map((id) =>
      PROVIDERS[id](systemPrompt, userPrompt)
    )
  );
}
