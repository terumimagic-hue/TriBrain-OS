import { ask } from "./llm";
import type { BookProjectRow, ChapterRow, EditorialNoteRow, StyleProfileRow } from "../db/models";
import type { FactIssue } from "./factcheck";
import type { ConceptOutput } from "./concept";

export async function reviseChapter(
  project: BookProjectRow,
  concept: ConceptOutput,
  chapter: ChapterRow,
  editorialNotes: EditorialNoteRow[],
  factIssues: FactIssue[],
  style: StyleProfileRow | null,
  agentRunId: string
): Promise<{ content: string } | { error: string }> {
  const ed = editorialNotes
    .filter((n) => !n.chapter_id || n.chapter_id === chapter.id)
    .map((n) => `- [${n.severity} · ${n.category}] ${n.text}${n.suggested_fix ? `\n  Fix: ${n.suggested_fix}` : ""}`)
    .join("\n");

  const fc = factIssues
    .filter((f) => f.chapter_position === chapter.position)
    .map((f) => `- [${f.status}] "${f.claim}" — ${f.reason}${f.suggested_fix ? ` // Fix: ${f.suggested_fix}` : ""}`)
    .join("\n");

  const styleBlock = style
    ? `# Style guide
voice: ${style.voice || ""}
cadence: ${style.cadence || ""}
pov: ${style.pov || ""}
do_use: ${style.do_use || ""}
do_not_use: ${style.do_not_use || ""}`
    : "";

  const system = `You are the Revision Agent (Claude) of BookBrain OS. You take a chapter draft, the editor's notes, and the fact-checker's notes, and produce a revised chapter that is better in every dimension without losing the author's voice.

Rules:
- Apply every actionable note. If a note conflicts with another, choose the higher-severity one and explain nothing — your output is the prose, not the rationale.
- Fix factual issues by either correcting, qualifying, or removing the claim.
- Preserve the author's voice and the style guide above.
- Keep approximate length unless the editor asked you to cut/expand.
- Output ONLY the revised chapter prose in markdown, starting with "# ${chapter.heading}".`;

  const user = `Language: ${project.language}
Tone: ${project.tone || "(unspecified)"}

# Concept reminder
core thesis: ${concept.core_thesis}
reader promise: ${concept.reader_promise}

${styleBlock}

# Original draft
${chapter.draft || ""}

# Editorial notes
${ed || "(none)"}

# Fact-check notes
${fc || "(none)"}

Return the revised chapter only.`;

  const r = await ask("claude", system, user, {
    projectId: project.id,
    agentRunId,
    temperature: 0.6,
    maxTokens: 8000
  });
  if (!r.ok) return { error: r.error };
  return { content: r.content };
}
