import { askJSON, embedOpenAI } from "./llm";
import { Knowledge } from "../db/models";
import type { BookProjectRow, ChapterRow } from "../db/models";
import type { KdpOutput } from "./kdp";
import type { ConceptOutput } from "./concept";

export interface IngestionOutput {
  book_summary: string;
  chapter_summaries: { position: number; summary: string }[];
  core_concepts: { title: string; description: string }[];
  unique_arguments: string[];
  reader_promise: string;
  tone_profile: string;
  writing_style_dna: {
    voice: string;
    cadence: string;
    vocabulary: string;
    pov: string;
    recurring_phrases: string[];
    do_use: string[];
    do_not_use: string[];
  };
  title_pattern: string;
  kdp_positioning: string;
  series_continuity_rules: string[];
  reusable_metaphors: string[];
  citations: string[];
  lessons_learned: string[];
}

export async function runIngestion(
  project: BookProjectRow,
  concept: ConceptOutput,
  kdp: KdpOutput,
  chapters: ChapterRow[],
  agentRunId: string
): Promise<{ data: IngestionOutput; raw: string } | { error: string; raw: string }> {
  const manuscript = chapters
    .map((c) => `# Chapter ${c.position}: ${c.heading}\n\n${(c.revised || c.draft || "").slice(0, 6000)}`)
    .join("\n\n");

  const system = `You are the Knowledge Ingestion Agent (James) of BookBrain OS. You distill a finished book into reusable knowledge for future books by the same author.

You don't summarize for the reader. You extract patterns the author can build on:
- the author's style DNA (so future books feel like the same author)
- the concepts already used (so future books don't repeat themselves)
- the series continuity rules (so future books stay consistent)
- the title and KDP patterns that worked
- the lessons learned (so future books are better)`;

  const user = `# Project
${project.title || project.working_title}

# Concept
${JSON.stringify(concept, null, 2)}

# KDP packaging (final)
${JSON.stringify({ title: kdp.title, subtitle: kdp.subtitle, description: kdp.description, keywords: kdp.keywords, categories: kdp.categories, cover_prompt: kdp.cover_prompt }, null, 2)}

# Manuscript (truncated per chapter)
${manuscript}

# Required JSON schema
${JSON.stringify({
  book_summary: "string",
  chapter_summaries: [{ position: 1, summary: "1-2 sentence summary" }],
  core_concepts: [{ title: "concept name", description: "1-3 sentences" }],
  unique_arguments: ["arguments that are this author's own"],
  reader_promise: "what readers got",
  tone_profile: "voice + cadence in 1-2 sentences",
  writing_style_dna: {
    voice: "string",
    cadence: "string",
    vocabulary: "string",
    pov: "1st/2nd/3rd",
    recurring_phrases: ["phrase 1"],
    do_use: ["pattern"],
    do_not_use: ["pattern"]
  },
  title_pattern: "what about the title earned attention",
  kdp_positioning: "the slot this book occupies on Amazon",
  series_continuity_rules: ["rule 1"],
  reusable_metaphors: ["metaphor 1"],
  citations: ["full citation string"],
  lessons_learned: ["lesson 1"]
}, null, 2)}`;

  return askJSON<IngestionOutput>("james", system, user, {
    projectId: project.id,
    agentRunId,
    temperature: 0.4,
    maxTokens: 4000
  });
}

// Persist ingestion output as embedded knowledge items
export async function persistKnowledge(
  projectId: string,
  ingestion: IngestionOutput
): Promise<{ items: number }> {
  const items: { kind: string; title: string; content: string; meta?: unknown }[] = [];
  items.push({ kind: "book_summary", title: "Book summary", content: ingestion.book_summary });
  items.push({ kind: "reader_promise", title: "Reader promise", content: ingestion.reader_promise });
  items.push({ kind: "tone", title: "Tone profile", content: ingestion.tone_profile });
  items.push({ kind: "title_pattern", title: "Title pattern", content: ingestion.title_pattern });
  items.push({ kind: "kdp_position", title: "KDP positioning", content: ingestion.kdp_positioning });
  items.push({ kind: "tone", title: "Writing style DNA", content: JSON.stringify(ingestion.writing_style_dna, null, 2), meta: ingestion.writing_style_dna });

  for (const cs of ingestion.chapter_summaries) {
    items.push({ kind: "chapter_summary", title: `Chapter ${cs.position}`, content: cs.summary, meta: { position: cs.position } });
  }
  for (const c of ingestion.core_concepts) {
    items.push({ kind: "concept", title: c.title, content: c.description });
  }
  for (const a of ingestion.unique_arguments) {
    items.push({ kind: "argument", title: a.slice(0, 80), content: a });
  }
  for (const r of ingestion.series_continuity_rules) {
    items.push({ kind: "series_rule", title: r.slice(0, 80), content: r });
  }
  for (const m of ingestion.reusable_metaphors) {
    items.push({ kind: "metaphor", title: m.slice(0, 80), content: m });
  }
  for (const c of ingestion.citations) {
    items.push({ kind: "citation", title: c.slice(0, 80), content: c });
  }
  for (const l of ingestion.lessons_learned) {
    items.push({ kind: "lesson", title: l.slice(0, 80), content: l });
  }

  let count = 0;
  for (const it of items) {
    const emb = await embedOpenAI(`${it.title}\n${it.content}`);
    Knowledge.add(
      projectId,
      it.kind,
      it.title,
      it.content,
      it.meta ?? null,
      emb?.vector,
      emb?.model
    );
    count += 1;
  }
  return { items: count };
}
