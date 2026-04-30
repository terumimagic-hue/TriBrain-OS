import type { DebateRound, ProviderId, ProviderResult } from "./types";
import { PROVIDERS, PROVIDER_LABELS } from "./providers";

const PROVIDER_IDS: ProviderId[] = ["openai", "anthropic", "gemini"];

function critiqueSystem(self: ProviderId): string {
  const selfLabel = PROVIDER_LABELS[self];
  return `You are ${selfLabel}, one of three AI panelists in a council. You will be shown the original question and the three initial answers (including your own). Critique the OTHER two answers honestly: what is wrong, what is missing, what is weak. Be specific. Then state which parts of your own answer you would revise after seeing theirs. Keep it tight and useful.`;
}

function reviseSystem(self: ProviderId): string {
  const selfLabel = PROVIDER_LABELS[self];
  return `You are ${selfLabel}. You have just critiqued the council's initial answers. Now produce a REVISED final answer that incorporates the strongest insights from the other panelists and corrects the weaknesses you identified in your own first pass. Self-contained answer only — no meta commentary.`;
}

function formatPanel(results: ProviderResult[]): string {
  return results
    .map((r) => {
      const label = PROVIDER_LABELS[r.provider];
      const body = r.ok ? r.content : `[ERROR: ${r.error}]`;
      return `### ${label}\n${body}`;
    })
    .join("\n\n---\n\n");
}

export async function runDebate(
  originalPrompt: string,
  initialResults: ProviderResult[]
): Promise<DebateRound[]> {
  const round1: DebateRound = { round: 1, results: initialResults };

  const panel = formatPanel(initialResults);

  const critiquePromises = PROVIDER_IDS.map((id) =>
    PROVIDERS[id](
      critiqueSystem(id),
      `Original question:\n"""\n${originalPrompt}\n"""\n\nInitial answers from the council:\n\n${panel}`
    )
  );
  const critiqueResults = await Promise.all(critiquePromises);
  const round2: DebateRound = { round: 2, results: critiqueResults };

  const critiquesPanel = formatPanel(critiqueResults);

  const revisePromises = PROVIDER_IDS.map((id) =>
    PROVIDERS[id](
      reviseSystem(id),
      `Original question:\n"""\n${originalPrompt}\n"""\n\nInitial answers:\n\n${panel}\n\nCritiques:\n\n${critiquesPanel}\n\nNow produce your revised final answer.`
    )
  );
  const reviseResults = await Promise.all(revisePromises);
  const round3: DebateRound = { round: 3, results: reviseResults };

  return [round1, round2, round3];
}
