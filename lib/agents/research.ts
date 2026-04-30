import { askJSON } from "./llm";
import type { BookProjectRow } from "../db/models";

export interface ResearchOutput {
  market_demand: string;
  competing_books: { title: string; author?: string; angle: string; weakness?: string }[];
  reader_pain_points: string[];
  search_intent: string;
  context_notes: string;
  unique_angle: string;
  credibility_notes: string;
  risk_notes: string;
  sources: { title?: string; url?: string; citation?: string; notes?: string }[];
}

export async function runResearch(
  project: BookProjectRow,
  knowledgeContext: string,
  agentRunId: string
): Promise<{ data: ResearchOutput; raw: string } | { error: string; raw: string }> {
  const system = `You are the Research Agent of BookBrain OS. Use rigorous, market-aware analysis. Ground your reasoning in concrete reader behavior and the actual non-fiction/fiction publishing market in ${project.market}.

Your job is to give a writer everything they need before drafting begins:
- WHO is the reader (concrete profile)
- WHAT are they searching for, in what words
- WHY existing books on this topic disappoint them
- WHERE the unique angle lives
- HOW to ground the book in defensible facts
- WHAT factual risks the writer must avoid

Be specific. Avoid platitudes. If you must speculate, label it as a hypothesis.`;

  const user = `# Project
Working title: ${project.working_title}
Idea: ${project.idea}
Language: ${project.language}
Target market: ${project.market}
Tone: ${project.tone || "(unspecified)"}
Estimated length: ${project.estimated_words || "(unspecified)"} words

# Past-book knowledge to respect or build on
${knowledgeContext || "(none)"}

# Required JSON schema
{
  "market_demand": "string — concrete demand signal in this market",
  "competing_books": [{ "title": "...", "author": "...", "angle": "...", "weakness": "..." }],
  "reader_pain_points": ["specific pain 1", "..."],
  "search_intent": "what readers actually type/search",
  "context_notes": "scientific / historical / cultural grounding the book must respect",
  "unique_angle": "1-2 sentences. The thesis nobody else owns.",
  "credibility_notes": "what authority / proof points the book needs",
  "risk_notes": "factual / legal / cultural risks the author must avoid",
  "sources": [{ "title": "...", "url": "...", "citation": "...", "notes": "..." }]
}`;

  return askJSON<ResearchOutput>("gemini", system, user, {
    projectId: project.id,
    agentRunId,
    temperature: 0.4
  });
}
