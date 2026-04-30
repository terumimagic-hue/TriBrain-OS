import { askJSON } from "./llm";
import type { BookProjectRow } from "../db/models";
import type { ResearchOutput } from "./research";
import type { ConceptOutput } from "./concept";

export interface StructureOutput {
  opening_hook: string;
  ending_design: string;
  narrative_arc: string;
  pacing_map: string;
  chapters: {
    position: number;
    heading: string;
    role: string;
    outline: string;
    target_words: number;
  }[];
}

export async function runStructure(
  project: BookProjectRow,
  research: ResearchOutput,
  concept: ConceptOutput,
  knowledgeContext: string,
  agentRunId: string
): Promise<{ data: StructureOutput; raw: string } | { error: string; raw: string }> {
  const total = project.estimated_words || 35000;
  const system = `You are the Structure Agent (Claude) of BookBrain OS. You design the spine of a commercial non-fiction or fiction book.

The structure must:
- Earn the reader's attention in chapter 1
- Make every chapter do one specific job
- Build a narrative arc that's felt, not just declared
- End with a payoff that delivers the reader_promise
- Allocate word counts that sum approximately to the project's target length

No filler chapters. No duplicate-purpose chapters.`;

  const user = `# Project
Working title: ${project.working_title}
Idea: ${project.idea}
Market: ${project.market}, Language: ${project.language}, Tone: ${project.tone || "(none)"}
Target total length: ~${total} words

# Concept
${JSON.stringify(concept, null, 2)}

# Research highlights
${JSON.stringify({
  reader_pain_points: research.reader_pain_points,
  unique_angle: research.unique_angle,
  context_notes: research.context_notes
}, null, 2)}

# Knowledge from past books (continuity / style / series rules)
${knowledgeContext || "(none)"}

# Required JSON schema
{
  "opening_hook": "First scene/argument that earns attention.",
  "ending_design": "How the final chapter delivers the reader_promise.",
  "narrative_arc": "1-paragraph description of the felt arc.",
  "pacing_map": "Where the reader speeds up, slows down, and turns.",
  "chapters": [
    {
      "position": 1,
      "heading": "Chapter title",
      "role": "What this chapter must do, in one phrase",
      "outline": "Bulleted outline of beats, each beat a sentence.",
      "target_words": 2000
    }
  ]
}

Aim for 8–14 chapters. Word counts should approximately sum to ${total}.`;

  return askJSON<StructureOutput>("claude", system, user, {
    projectId: project.id,
    agentRunId,
    temperature: 0.5,
    maxTokens: 8000
  });
}
