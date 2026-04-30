import { askJSON } from "./llm";
import type { BookProjectRow, ChapterRow } from "../db/models";
import type { ConceptOutput } from "./concept";

export interface EditorialIssue {
  chapter_position?: number;
  category: "clarity" | "structure" | "tone" | "repetition" | "weak" | "commercial";
  severity: "low" | "medium" | "high";
  text: string;
  suggested_fix?: string;
}

export interface EditorialOutput {
  overall_assessment: string;
  reader_retention_risk: string;
  commercial_strength: string;
  weakest_chapter: number | null;
  strongest_chapter: number | null;
  issues: EditorialIssue[];
}

export async function runEditorial(
  project: BookProjectRow,
  concept: ConceptOutput,
  chapters: ChapterRow[],
  agentRunId: string
): Promise<{ data: EditorialOutput; raw: string } | { error: string; raw: string }> {
  const manuscript = chapters
    .map((c) => `# Chapter ${c.position}: ${c.heading}\n\n${(c.revised || c.draft || "").slice(0, 8000)}`)
    .join("\n\n---\n\n");

  const system = `You are the Editorial Agent (James) of BookBrain OS. You apply commercial publishing standards: clarity, structure, tone, originality, KDP suitability, reader retention.

You do not rewrite. You diagnose. Be specific: name the chapter, name the problem, propose the surgical fix.`;

  const user = `# Concept
${JSON.stringify(concept, null, 2)}

# Tone target
${project.tone || "(unspecified)"}

# Manuscript (truncated per chapter)
${manuscript}

# Required JSON schema
{
  "overall_assessment": "Brutally honest 1-paragraph diagnosis.",
  "reader_retention_risk": "Where readers are most likely to put the book down, and why.",
  "commercial_strength": "Will this sell on Amazon? Why / why not?",
  "weakest_chapter": null | number,
  "strongest_chapter": null | number,
  "issues": [
    {
      "chapter_position": 3,
      "category": "clarity" | "structure" | "tone" | "repetition" | "weak" | "commercial",
      "severity": "low" | "medium" | "high",
      "text": "Specific description of the problem.",
      "suggested_fix": "Concrete fix the writer can apply."
    }
  ]
}`;

  return askJSON<EditorialOutput>("james", system, user, {
    projectId: project.id,
    agentRunId,
    temperature: 0.4,
    maxTokens: 6000
  });
}
