import { askJSON } from "./llm";
import type { BookProjectRow, ChapterRow } from "../db/models";

export interface FactIssue {
  chapter_position: number;
  claim: string;
  status: "supported" | "unsupported" | "incorrect" | "risky";
  reason: string;
  suggested_fix?: string;
}

export interface FactCheckOutput {
  summary: string;
  issues: FactIssue[];
}

export async function runFactCheck(
  project: BookProjectRow,
  chapters: ChapterRow[],
  agentRunId: string
): Promise<{ data: FactCheckOutput; raw: string } | { error: string; raw: string }> {
  const manuscript = chapters
    .map((c) => `# Chapter ${c.position}: ${c.heading}\n\n${(c.revised || c.draft || "").slice(0, 8000)}`)
    .join("\n\n---\n\n");

  const system = `You are the Fact Check Agent (Gemini) of BookBrain OS. You scan a manuscript for factual, historical, scientific, legal, and cultural risks.

For every concrete factual claim, classify it:
- supported: standard, well-established
- unsupported: needs a citation or rephrasing as opinion
- incorrect: this is wrong; here's the correct version
- risky: legally / culturally / medically risky as written

Don't flag opinions or stylistic choices. Only factual claims.`;

  const user = `Language: ${project.language}, Market: ${project.market}

# Manuscript
${manuscript}

# Required JSON schema
{
  "summary": "1-paragraph overall reliability assessment.",
  "issues": [
    {
      "chapter_position": 1,
      "claim": "Quote of the actual claim text.",
      "status": "supported" | "unsupported" | "incorrect" | "risky",
      "reason": "Why.",
      "suggested_fix": "How to revise."
    }
  ]
}`;

  return askJSON<FactCheckOutput>("gemini", system, user, {
    projectId: project.id,
    agentRunId,
    temperature: 0.2
  });
}
