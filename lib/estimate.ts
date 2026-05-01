import { PRICING } from "./providers/cost";

export interface StepEstimate {
  step: string;
  agent: "gemini" | "claude" | "james";
  model: string;
  inputTokens: number;
  outputTokens: number;
  usd: number;
  notes: string;
}

export interface BookEstimate {
  totalUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  steps: StepEstimate[];
}

interface EstimateInput {
  estimatedWords: number;
  estimatedChapters?: number;
}

const TOK_PER_WORD = 1.3;

export function estimateBook(input: EstimateInput): BookEstimate {
  const words = Math.max(5000, input.estimatedWords);
  const chapters = input.estimatedChapters || Math.max(8, Math.min(14, Math.round(words / 2500)));
  const wordsPerChapter = Math.round(words / chapters);
  const draftTokensPerChapter = Math.round(wordsPerChapter * TOK_PER_WORD);

  const claudeModel = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const openaiModel = process.env.OPENAI_MODEL || "gpt-4o";
  const geminiModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  const steps: StepEstimate[] = [
    mk("research", "gemini", geminiModel, 1500, 1500, "Reader, market, sources"),
    mk("concept", "james", openaiModel, 1500, 1500, "Thesis + go/no-go"),
    mk("structure", "claude", claudeModel, 2000, 3000, `${chapters} chapters, pacing`),
    mk(
      "drafting",
      "claude",
      claudeModel,
      Math.round((1200 + draftTokensPerChapter * 0.3) * chapters),
      Math.round(draftTokensPerChapter * chapters),
      `${chapters} chapters × ~${wordsPerChapter} words`
    ),
    mk("editorial", "james", openaiModel, Math.round(draftTokensPerChapter * chapters), 3000, "Diagnosis only"),
    mk("factcheck", "gemini", geminiModel, Math.round(draftTokensPerChapter * chapters), 3000, "Risky claims"),
    mk(
      "revision",
      "claude",
      claudeModel,
      Math.round((1500 + draftTokensPerChapter) * chapters),
      Math.round(draftTokensPerChapter * chapters),
      "Per-chapter rewrite"
    ),
    mk("kdp", "james", openaiModel, 3000, 2000, "Title, description, 7 keywords, A+, cover prompt"),
    mk(
      "ingestion",
      "james",
      openaiModel,
      Math.round(draftTokensPerChapter * chapters),
      3000,
      "Distill into knowledge + embeddings"
    )
  ];

  const totalUsd = steps.reduce((s, x) => s + x.usd, 0);
  const totalInputTokens = steps.reduce((s, x) => s + x.inputTokens, 0);
  const totalOutputTokens = steps.reduce((s, x) => s + x.outputTokens, 0);

  return { totalUsd, totalInputTokens, totalOutputTokens, steps };
}

function mk(
  step: string,
  agent: "gemini" | "claude" | "james",
  model: string,
  inT: number,
  outT: number,
  notes: string
): StepEstimate {
  const p = PRICING[model];
  const usd = p ? (inT / 1000) * p.in + (outT / 1000) * p.out : 0;
  return { step, agent, model, inputTokens: inT, outputTokens: outT, usd, notes };
}
