import { askJSON } from "./llm";
import type { BookProjectRow, ChapterRow } from "../db/models";
import type { ConceptOutput } from "./concept";

export interface KdpOutput {
  title: string;
  subtitle: string;
  romanized_title?: string;
  furigana?: string;
  description: string;            // KDP HTML-safe description
  author_bio: string;
  keywords: string[];             // exactly 7
  categories: string[];           // 2-3
  pricing: { ebook_usd: number; paperback_usd: number; jpy?: number };
  kindle_select: boolean;
  aplus_content: string;          // markdown
  launch_copy: string;            // for landing page / email
  social_posts: string[];         // 3-5 posts
  cover_prompt: string;           // image prompt for the cover
}

export async function runKdp(
  project: BookProjectRow,
  concept: ConceptOutput,
  chapters: ChapterRow[],
  agentRunId: string
): Promise<{ data: KdpOutput; raw: string } | { error: string; raw: string }> {
  const tocSnippet = chapters
    .map((c) => `${c.position}. ${c.heading} — ${c.role || ""}`)
    .join("\n");

  const isJP = project.language?.toLowerCase().startsWith("ja");

  const system = `You are the KDP Package Agent (James) of BookBrain OS. You ship books on Amazon. You write in the language of the book (${project.language}).

Your output is launch-ready: title, description, 7 keywords, categories, pricing, A+ content, launch copy, social posts, and a cover-image prompt that an image model can render.

Optimize for:
- Click: cover prompt + title + emotional hook
- Conversion: description + reader promise + objections handled
- Discovery: 7 KDP keywords that match real search intent
- Authority: author bio that earns trust
${isJP ? `- For Japanese books, also output romanized_title and furigana for the title.` : ""}`;

  const user = `# Concept
${JSON.stringify(concept, null, 2)}

# Working title (you may keep, refine, or replace)
${project.working_title}

# Table of contents
${tocSnippet}

# Required JSON schema
{
  "title": "Final main title.",
  "subtitle": "Punchy subtitle that triples the reader's understanding.",
  ${isJP ? `"romanized_title": "Romaji of title.",
  "furigana": "Furigana for title.",` : ""}
  "description": "Multi-paragraph KDP description. Use line breaks. Lead with hook, deliver promise, handle objections, end with CTA.",
  "author_bio": "Trust-building 1-paragraph bio.",
  "keywords": ["7 distinct keywords or short phrases"],
  "categories": ["BISAC categories or KDP category labels"],
  "pricing": { "ebook_usd": 4.99, "paperback_usd": 14.99${isJP ? `, "jpy": 600` : ""} },
  "kindle_select": true,
  "aplus_content": "Markdown copy for Amazon A+ Content modules. Use ## section headings.",
  "launch_copy": "Long-form launch copy for landing page or email.",
  "social_posts": ["3-5 ready-to-post short pieces"],
  "cover_prompt": "Detailed image prompt: subject, mood, color palette, composition, typography hint."
}`;

  return askJSON<KdpOutput>("james", system, user, {
    projectId: project.id,
    agentRunId,
    temperature: 0.7,
    maxTokens: 4000
  });
}
