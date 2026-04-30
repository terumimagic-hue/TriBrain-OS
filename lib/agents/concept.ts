import { askJSON } from "./llm";
import type { BookProjectRow } from "../db/models";
import type { ResearchOutput } from "./research";

export interface ConceptOutput {
  core_thesis: string;
  reader_promise: string;
  positioning: string;
  differentiation: string;
  emotional_hook: string;
  commercial_viability_score: number; // 0-100
  go_no_go: "go" | "pivot" | "no-go";
  go_no_go_reasoning: string;
}

export async function runConcept(
  project: BookProjectRow,
  research: ResearchOutput,
  knowledgeContext: string,
  agentRunId: string
): Promise<{ data: ConceptOutput; raw: string } | { error: string; raw: string }> {
  const system = `You are the Concept Agent (James) of BookBrain OS. You make the commercial publishing call.

You take research and the writer's idea and return a single, sharp book concept that can survive contact with a real reader and a real Amazon search bar. You do not flatter. If the idea is weak, say "pivot" or "no-go" with reasoning.`;

  const user = `# Project
Working title: ${project.working_title}
Idea: ${project.idea}
Market: ${project.market}, Language: ${project.language}, Tone: ${project.tone || "(none)"}

# Research summary
${JSON.stringify(research, null, 2)}

# Knowledge from past books (avoid repeating yourself; build on continuity)
${knowledgeContext || "(none)"}

# Required JSON schema
{
  "core_thesis": "1 sentence. The single defensible idea this book argues.",
  "reader_promise": "What the reader will be able to do/believe/feel after finishing.",
  "positioning": "Where this book sits relative to competitors. 1-2 sentences.",
  "differentiation": "Why a reader picks this over the top 3 competitors. Specific.",
  "emotional_hook": "The feeling the cover/title/intro must trigger.",
  "commercial_viability_score": 0,
  "go_no_go": "go" | "pivot" | "no-go",
  "go_no_go_reasoning": "Concrete reasoning. If pivot, propose the pivot."
}`;

  return askJSON<ConceptOutput>("james", system, user, {
    projectId: project.id,
    agentRunId,
    temperature: 0.5
  });
}
