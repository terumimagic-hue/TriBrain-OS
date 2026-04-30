import type { BookProjectRow, ChapterRow, KdpRow, ResearchNoteRow, EditorialNoteRow } from "../db/models";
import { J } from "../db/models";

export function manuscriptMarkdown(project: BookProjectRow, chapters: ChapterRow[]): string {
  const title = project.title || project.working_title;
  const lines: string[] = [];
  lines.push(`# ${title}`);
  lines.push("");
  for (const c of chapters) {
    const body = c.revised || c.draft || "";
    if (!body.trim()) continue;
    lines.push(body.startsWith("#") ? body : `# ${c.heading}\n\n${body}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function kdpMarkdown(kdp: KdpRow): string {
  const keywords = J.parse<string[]>(kdp.keywords, []);
  const cats = J.parse<string[]>(kdp.categories, []);
  const social = J.parse<string[]>(kdp.social_posts, []);
  const pricing = J.parse<Record<string, number>>(kdp.pricing, {});
  return [
    `# KDP Package`,
    ``,
    `**Title**: ${kdp.title || ""}`,
    `**Subtitle**: ${kdp.subtitle || ""}`,
    kdp.romanized_title ? `**Romanized**: ${kdp.romanized_title}` : "",
    kdp.furigana ? `**Furigana**: ${kdp.furigana}` : "",
    ``,
    `## Description`,
    kdp.description || "",
    ``,
    `## Author bio`,
    kdp.author_bio || "",
    ``,
    `## Keywords`,
    keywords.map((k) => `- ${k}`).join("\n"),
    ``,
    `## Categories`,
    cats.map((c) => `- ${c}`).join("\n"),
    ``,
    `## Pricing`,
    "```json",
    JSON.stringify(pricing, null, 2),
    "```",
    ``,
    `**Kindle Select**: ${kdp.kindle_select ? "yes" : "no"}`,
    ``,
    `## A+ Content`,
    kdp.aplus_content || "",
    ``,
    `## Launch copy`,
    kdp.launch_copy || "",
    ``,
    `## Social posts`,
    social.map((s, i) => `### ${i + 1}\n${s}`).join("\n\n"),
    ``,
    `## Cover prompt`,
    kdp.cover_prompt || ""
  ]
    .filter(Boolean)
    .join("\n");
}

export function researchMarkdown(note: ResearchNoteRow | null): string {
  if (!note) return "# Research report\n\n(none)";
  const cb = J.parse<{ title: string; author?: string; angle: string; weakness?: string }[]>(note.competing_books, []);
  const pp = J.parse<string[]>(note.reader_pain_points, []);
  return [
    `# Research report`,
    ``,
    `## Market demand`,
    note.market_demand || "",
    ``,
    `## Competing books`,
    cb.map((b) => `- **${b.title}**${b.author ? ` — ${b.author}` : ""}\n  angle: ${b.angle}${b.weakness ? `\n  weakness: ${b.weakness}` : ""}`).join("\n"),
    ``,
    `## Reader pain points`,
    pp.map((p) => `- ${p}`).join("\n"),
    ``,
    `## Search intent`,
    note.search_intent || "",
    ``,
    `## Context notes`,
    note.context_notes || "",
    ``,
    `## Unique angle`,
    note.unique_angle || "",
    ``,
    `## Credibility notes`,
    note.credibility_notes || "",
    ``,
    `## Risk notes`,
    note.risk_notes || ""
  ].join("\n");
}

export function editorialMarkdown(notes: EditorialNoteRow[]): string {
  if (!notes.length) return "# Editorial report\n\n(no notes)";
  const lines: string[] = ["# Editorial report", ""];
  for (const n of notes) {
    lines.push(`## [${n.severity}] ${n.category}${n.chapter_id ? ` (chapter ${n.chapter_id})` : ""}`);
    lines.push(n.text);
    if (n.suggested_fix) {
      lines.push("");
      lines.push(`**Suggested fix:** ${n.suggested_fix}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function aplusMarkdown(kdp: KdpRow): string {
  return `# A+ Content\n\n${kdp.aplus_content || ""}`;
}

export function coverPromptMarkdown(kdp: KdpRow): string {
  return `# Cover prompt\n\n${kdp.cover_prompt || ""}`;
}
