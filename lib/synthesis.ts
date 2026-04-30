import type { ProviderId, ProviderResult } from "./types";
import { PROVIDERS, PROVIDER_LABELS } from "./providers";

const DEFAULT = (process.env.SYNTHESIS_PROVIDER || "anthropic") as ProviderId;

const SYSTEM = `You are the Final Judge of an AI council. Three independent AI assistants (ChatGPT, Claude, Gemini) have answered the same user prompt. Your job is to:

1. Compare their answers honestly. Identify agreements, contradictions, and unique insights.
2. Critique each: what is strong, what is weak, what is wrong.
3. Merge the best parts and resolve conflicts with reasoning, not vote-counting.
4. Produce ONE final answer that is better than any individual answer.

Output format (markdown):
## Final Answer
<the merged best answer, self-contained>

## Why this beats the individual answers
- <bullet points calling out the specific moves you made>

## Notable disagreements
- <if any; otherwise write "None">`;

export function buildSynthesisUserPrompt(
  originalPrompt: string,
  results: ProviderResult[]
): string {
  const blocks = results
    .map((r) => {
      const label = PROVIDER_LABELS[r.provider];
      if (r.ok) {
        return `### ${label} (${r.model})\n${r.content}`;
      }
      return `### ${label} (${r.model})\n[ERROR: ${r.error}]`;
    })
    .join("\n\n---\n\n");

  return `User's original prompt:\n"""\n${originalPrompt}\n"""\n\nThe three answers:\n\n${blocks}`;
}

export async function synthesize(
  originalPrompt: string,
  results: ProviderResult[],
  preferredProvider: ProviderId = DEFAULT
): Promise<{ provider: ProviderId; content: string } | { error: string }> {
  const userPrompt = buildSynthesisUserPrompt(originalPrompt, results);
  const order: ProviderId[] = [
    preferredProvider,
    ...(["anthropic", "openai", "gemini"] as ProviderId[]).filter(
      (p) => p !== preferredProvider
    )
  ];

  let lastError = "no provider available";
  for (const id of order) {
    const result = await PROVIDERS[id](SYSTEM, userPrompt);
    if (result.ok) {
      return { provider: id, content: result.content };
    }
    lastError = result.error;
  }
  return { error: lastError };
}
