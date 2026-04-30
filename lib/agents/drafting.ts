import { ask } from "./llm";
import type { BookProjectRow, ChapterRow, StyleProfileRow } from "../db/models";
import type { ConceptOutput } from "./concept";

export async function draftChapter(
  project: BookProjectRow,
  concept: ConceptOutput,
  chapter: ChapterRow,
  previousChapters: ChapterRow[],
  styleHint: StyleProfileRow | null,
  knowledgeContext: string,
  agentRunId: string
): Promise<{ content: string } | { error: string }> {
  const previousSummaries = previousChapters
    .filter((c) => c.draft || c.revised)
    .map((c) => `## ${c.position}. ${c.heading}\n(role: ${c.role})\n${(c.revised || c.draft || "").slice(0, 1200)}…`)
    .join("\n\n");

  const styleBlock = styleHint
    ? `# Style guide (continuity)
voice: ${styleHint.voice || "(n/a)"}
cadence: ${styleHint.cadence || "(n/a)"}
pov: ${styleHint.pov || "(n/a)"}
do_use: ${styleHint.do_use || "[]"}
do_not_use: ${styleHint.do_not_use || "[]"}
recurring_phrases: ${styleHint.recurring_phrases || "[]"}`
    : "";

  const system = `You are the Drafting Agent (Claude) of BookBrain OS. You write commercial-grade prose, in ${project.language}.

Rules:
- Write the FULL chapter as continuous prose. No outlines, no bullet stubs, no [placeholders].
- Hold the chapter's role tightly. Do not drift into other chapters' territory.
- Open with a hook that pulls the reader IN. Close with a hand-off that pulls them to the next chapter.
- Match the style guide and the established voice. Do not echo the previous chapters' opening structures.
- Use scenes, examples, dialogue, or evidence — not just declarative claims.
- Section headings are allowed; use ## for sub-sections within the chapter.
- Hit roughly the target word count, ±15%.`;

  const user = `# Book context
Working title: ${project.working_title}
Core thesis: ${concept.core_thesis}
Reader promise: ${concept.reader_promise}
Emotional hook: ${concept.emotional_hook}
Tone: ${project.tone || "(unspecified)"}
Language: ${project.language}

${styleBlock}

# Previous chapters (for continuity, do not repeat)
${previousSummaries || "(this is the first chapter being drafted)"}

# Knowledge from past books (style / phrasing / lessons)
${knowledgeContext || "(none)"}

# This chapter
Position: ${chapter.position}
Heading: ${chapter.heading}
Role: ${chapter.role || "(none)"}
Outline:
${chapter.outline || "(none)"}
Target word count: ${chapter.target_words || 2000}

Write the chapter now. Output ONLY the chapter prose in markdown, starting with "# ${chapter.heading}".`;

  const r = await ask("claude", system, user, {
    projectId: project.id,
    agentRunId,
    temperature: 0.8,
    maxTokens: 8000
  });
  if (!r.ok) return { error: r.error };
  return { content: r.content };
}
