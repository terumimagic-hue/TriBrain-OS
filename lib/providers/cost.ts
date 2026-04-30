// Approximate per-1K-token pricing in USD. Update as needed.
// Numbers are rough public estimates; the UI labels them as "estimated".
interface Pricing { in: number; out: number; embed?: number }

export const PRICING: Record<string, Pricing> = {
  // OpenAI
  "gpt-4o": { in: 0.0025, out: 0.01 },
  "gpt-4o-mini": { in: 0.00015, out: 0.0006 },
  "gpt-4.1": { in: 0.002, out: 0.008 },
  "gpt-4.1-mini": { in: 0.0004, out: 0.0016 },
  "text-embedding-3-small": { in: 0.00002, out: 0, embed: 0.00002 },
  "text-embedding-3-large": { in: 0.00013, out: 0, embed: 0.00013 },

  // Anthropic
  "claude-sonnet-4-6": { in: 0.003, out: 0.015 },
  "claude-opus-4-7": { in: 0.015, out: 0.075 },
  "claude-haiku-4-5-20251001": { in: 0.0008, out: 0.004 },

  // Google
  "gemini-2.0-flash": { in: 0.0001, out: 0.0004 },
  "gemini-1.5-pro": { in: 0.00125, out: 0.005 }
};

export function estimateUSD(model: string, inTokens: number, outTokens: number): number {
  const p = PRICING[model];
  if (!p) return 0;
  return (inTokens / 1000) * p.in + (outTokens / 1000) * p.out;
}

export function approxTokens(text: string): number {
  // Rough heuristic: ~4 chars per token.
  return Math.ceil((text || "").length / 4);
}
