import { promises as fs } from "node:fs";
import path from "node:path";
import {
  AgentRuns,
  Chapters,
  EditorialNotes,
  Exports,
  Kdp,
  Knowledge,
  Manuscripts,
  Projects,
  ResearchNotes,
  Sources,
  StyleProfiles,
  J,
  type AgentRunRow,
  type BookProjectRow,
  type ChapterRow
} from "../db/models";
import { exportDir } from "../db/client";
import { getStep, type StepId } from "./steps";
import { runResearch } from "../agents/research";
import { runConcept, type ConceptOutput } from "../agents/concept";
import { runStructure } from "../agents/structure";
import { draftChapter } from "../agents/drafting";
import { runEditorial } from "../agents/editorial";
import { runFactCheck, type FactIssue } from "../agents/factcheck";
import { reviseChapter } from "../agents/revision";
import { runKdp } from "../agents/kdp";
import { runIngestion, persistKnowledge } from "../agents/ingestion";
import { retrieveKnowledge, formatKnowledgeForPrompt } from "../agents/retrieval";
import { manuscriptDocx } from "../export/docx";
import {
  manuscriptMarkdown,
  kdpMarkdown,
  researchMarkdown,
  editorialMarkdown,
  aplusMarkdown,
  coverPromptMarkdown
} from "../export/markdown";

export interface RunResult {
  ok: boolean;
  step: StepId;
  agentRunId: string;
  output?: unknown;
  error?: string;
}

function newAgentRun(projectId: string, step: StepId, agent: string, input: unknown): AgentRunRow {
  return AgentRuns.create(projectId, step, agent, input);
}

function fail(run: AgentRunRow, msg: string): RunResult {
  AgentRuns.fail(run.id, msg);
  Projects.update(run.project_id, { status: "error", current_step: run.step });
  return { ok: false, step: run.step as StepId, agentRunId: run.id, error: msg };
}

function done(run: AgentRunRow, output: unknown, projectId: string): RunResult {
  AgentRuns.finish(run.id, output);
  Projects.update(projectId, { current_step: run.step, status: "running" });
  return { ok: true, step: run.step as StepId, agentRunId: run.id, output };
}

function getConcept(projectId: string): ConceptOutput | null {
  const r = AgentRuns.latest(projectId, "concept");
  if (!r || r.status !== "done") return null;
  return J.parse<ConceptOutput | null>(r.output, null);
}

async function getKnowledgeContext(project: BookProjectRow): Promise<string> {
  const query = `${project.working_title} ${project.idea}`;
  const hits = await retrieveKnowledge(query, { excludeProjectId: project.id });
  return formatKnowledgeForPrompt(hits);
}

export async function runStep(projectId: string, step: StepId): Promise<RunResult> {
  const project = Projects.get(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);
  const def = getStep(step);

  switch (step) {
    case "research": {
      const run = newAgentRun(projectId, "research", "gemini", { idea: project.idea });
      const knowledge = await getKnowledgeContext(project);
      const r = await runResearch(project, knowledge, run.id);
      if ("error" in r) return fail(run, r.error);
      ResearchNotes.save(projectId, {
        market_demand: r.data.market_demand,
        competing_books: J.stringify(r.data.competing_books),
        reader_pain_points: J.stringify(r.data.reader_pain_points),
        search_intent: r.data.search_intent,
        context_notes: r.data.context_notes,
        unique_angle: r.data.unique_angle,
        credibility_notes: r.data.credibility_notes,
        risk_notes: r.data.risk_notes,
        raw: r.raw
      });
      Sources.clearProject(projectId);
      for (const s of r.data.sources || []) {
        Sources.add(projectId, {
          title: s.title ?? null,
          url: s.url ?? null,
          citation: s.citation ?? null,
          notes: s.notes ?? null
        });
      }
      return done(run, r.data, projectId);
    }

    case "concept": {
      const research = ResearchNotes.byProject(projectId);
      if (!research?.raw) return fail(newAgentRun(projectId, "concept", "james", {}), "Research not found. Run research first.");
      const researchData = J.parse<unknown>(research.raw, {});
      const run = newAgentRun(projectId, "concept", "james", { working_title: project.working_title });
      const knowledge = await getKnowledgeContext(project);
      const r = await runConcept(project, researchData as never, knowledge, run.id);
      if ("error" in r) return fail(run, r.error);
      return done(run, r.data, projectId);
    }

    case "structure": {
      const research = ResearchNotes.byProject(projectId);
      if (!research?.raw) return fail(newAgentRun(projectId, "structure", "claude", {}), "Research missing.");
      const concept = getConcept(projectId);
      if (!concept) return fail(newAgentRun(projectId, "structure", "claude", {}), "Concept missing. Run concept step.");
      const researchData = J.parse<unknown>(research.raw, {});
      const run = newAgentRun(projectId, "structure", "claude", {});
      const knowledge = await getKnowledgeContext(project);
      const r = await runStructure(project, researchData as never, concept, knowledge, run.id);
      if ("error" in r) return fail(run, r.error);
      Chapters.clear(projectId);
      for (const ch of r.data.chapters) {
        Chapters.upsert(
          projectId,
          ch.position,
          ch.heading,
          ch.role,
          ch.outline,
          ch.target_words
        );
      }
      return done(run, r.data, projectId);
    }

    case "drafting": {
      const concept = getConcept(projectId);
      if (!concept) return fail(newAgentRun(projectId, "drafting", "claude", {}), "Concept missing.");
      const chapters = Chapters.byProject(projectId);
      if (!chapters.length) return fail(newAgentRun(projectId, "drafting", "claude", {}), "No chapters. Run structure step.");
      const style = StyleProfiles.byProject(projectId);
      const run = newAgentRun(projectId, "drafting", "claude", { chapters: chapters.length });
      const knowledge = await getKnowledgeContext(project);
      const drafted: { position: number; heading: string; ok: boolean; error?: string }[] = [];
      for (const ch of chapters) {
        const previous = chapters.filter((c) => c.position < ch.position);
        const r = await draftChapter(project, concept, ch, previous, style, knowledge, run.id);
        if ("error" in r) {
          drafted.push({ position: ch.position, heading: ch.heading, ok: false, error: r.error });
          continue;
        }
        Chapters.setDraft(ch.id, r.content);
        drafted.push({ position: ch.position, heading: ch.heading, ok: true });
      }
      const fullText = manuscriptMarkdown(project, Chapters.byProject(projectId));
      Manuscripts.add(projectId, "draft v1", fullText);
      return done(run, { drafted }, projectId);
    }

    case "editorial": {
      const concept = getConcept(projectId);
      if (!concept) return fail(newAgentRun(projectId, "editorial", "james", {}), "Concept missing.");
      const chapters = Chapters.byProject(projectId);
      if (!chapters.length) return fail(newAgentRun(projectId, "editorial", "james", {}), "No chapters.");
      const run = newAgentRun(projectId, "editorial", "james", {});
      const r = await runEditorial(project, concept, chapters, run.id);
      if ("error" in r) return fail(run, r.error);
      // Reset and persist notes
      for (const ch of chapters) EditorialNotes.clearForChapter(ch.id);
      for (const issue of r.data.issues) {
        const ch = chapters.find((c) => c.position === issue.chapter_position);
        EditorialNotes.add(projectId, {
          chapter_id: ch ? ch.id : null,
          category: issue.category,
          severity: issue.severity,
          text: issue.text,
          suggested_fix: issue.suggested_fix ?? null
        });
      }
      return done(run, r.data, projectId);
    }

    case "factcheck": {
      const chapters = Chapters.byProject(projectId);
      if (!chapters.length) return fail(newAgentRun(projectId, "factcheck", "gemini", {}), "No chapters.");
      const run = newAgentRun(projectId, "factcheck", "gemini", {});
      const r = await runFactCheck(project, chapters, run.id);
      if ("error" in r) return fail(run, r.error);
      return done(run, r.data, projectId);
    }

    case "revision": {
      const concept = getConcept(projectId);
      if (!concept) return fail(newAgentRun(projectId, "revision", "claude", {}), "Concept missing.");
      const chapters = Chapters.byProject(projectId);
      if (!chapters.length) return fail(newAgentRun(projectId, "revision", "claude", {}), "No chapters.");
      const editorialNotes = EditorialNotes.byProject(projectId);
      const fc = AgentRuns.latest(projectId, "factcheck");
      const fcOut = fc && fc.status === "done" ? J.parse<{ issues: FactIssue[] }>(fc.output, { issues: [] }) : { issues: [] };
      const style = StyleProfiles.byProject(projectId);
      const run = newAgentRun(projectId, "revision", "claude", {});
      const revised: { position: number; ok: boolean; error?: string }[] = [];
      for (const ch of chapters) {
        const r = await reviseChapter(project, concept, ch, editorialNotes, fcOut.issues, style, run.id);
        if ("error" in r) {
          revised.push({ position: ch.position, ok: false, error: r.error });
          continue;
        }
        Chapters.setRevised(ch.id, r.content);
        revised.push({ position: ch.position, ok: true });
      }
      const text = manuscriptMarkdown(project, Chapters.byProject(projectId));
      Manuscripts.add(projectId, "revised v1", text);
      return done(run, { revised }, projectId);
    }

    case "kdp": {
      const concept = getConcept(projectId);
      if (!concept) return fail(newAgentRun(projectId, "kdp", "james", {}), "Concept missing.");
      const chapters = Chapters.byProject(projectId);
      const run = newAgentRun(projectId, "kdp", "james", {});
      const r = await runKdp(project, concept, chapters, run.id);
      if ("error" in r) return fail(run, r.error);
      Kdp.save(projectId, {
        title: r.data.title,
        subtitle: r.data.subtitle,
        romanized_title: r.data.romanized_title ?? null,
        furigana: r.data.furigana ?? null,
        author_bio: r.data.author_bio,
        description: r.data.description,
        keywords: J.stringify(r.data.keywords),
        categories: J.stringify(r.data.categories),
        pricing: J.stringify(r.data.pricing),
        kindle_select: r.data.kindle_select ? 1 : 0,
        aplus_content: r.data.aplus_content,
        launch_copy: r.data.launch_copy,
        social_posts: J.stringify(r.data.social_posts),
        cover_prompt: r.data.cover_prompt
      });
      Projects.update(projectId, { title: r.data.title });
      return done(run, r.data, projectId);
    }

    case "export": {
      const run = newAgentRun(projectId, "export", "system", {});
      const chapters = Chapters.byProject(projectId);
      const kdp = Kdp.byProject(projectId);
      const research = ResearchNotes.byProject(projectId);
      const editorial = EditorialNotes.byProject(projectId);
      const dir = await exportDir();
      const projDir = path.join(dir, project.id);
      await fs.mkdir(projDir, { recursive: true });

      const files: { kind: string; path: string; bytes: number }[] = [];

      const md = manuscriptMarkdown(project, chapters);
      const mdPath = path.join(projDir, "manuscript.md");
      await fs.writeFile(mdPath, md, "utf-8");
      files.push({ kind: "manuscript_md", path: mdPath, bytes: Buffer.byteLength(md) });

      try {
        const buf = await manuscriptDocx(project, chapters);
        const dxPath = path.join(projDir, "manuscript.docx");
        await fs.writeFile(dxPath, buf);
        files.push({ kind: "manuscript_docx", path: dxPath, bytes: buf.byteLength });
      } catch (err) {
        // docx is non-essential; continue
      }

      if (kdp) {
        const kdpMd = kdpMarkdown(kdp);
        const p = path.join(projDir, "kdp_metadata.md");
        await fs.writeFile(p, kdpMd, "utf-8");
        files.push({ kind: "kdp_md", path: p, bytes: Buffer.byteLength(kdpMd) });

        const apl = aplusMarkdown(kdp);
        const ap = path.join(projDir, "aplus_content.md");
        await fs.writeFile(ap, apl, "utf-8");
        files.push({ kind: "aplus_md", path: ap, bytes: Buffer.byteLength(apl) });

        const cp = coverPromptMarkdown(kdp);
        const cpp = path.join(projDir, "cover_prompt.md");
        await fs.writeFile(cpp, cp, "utf-8");
        files.push({ kind: "cover_prompt_md", path: cpp, bytes: Buffer.byteLength(cp) });
      }

      const research_md = researchMarkdown(research);
      const rp = path.join(projDir, "research_report.md");
      await fs.writeFile(rp, research_md, "utf-8");
      files.push({ kind: "research_md", path: rp, bytes: Buffer.byteLength(research_md) });

      const ed_md = editorialMarkdown(editorial);
      const ep = path.join(projDir, "editorial_report.md");
      await fs.writeFile(ep, ed_md, "utf-8");
      files.push({ kind: "editorial_md", path: ep, bytes: Buffer.byteLength(ed_md) });

      const summary = {
        project,
        chapters: chapters.map((c) => ({
          position: c.position,
          heading: c.heading,
          word_count: c.word_count,
          status: c.status
        })),
        kdp,
        research_summary: research?.unique_angle,
        editorial_count: editorial.length
      };
      const sp = path.join(projDir, "project_summary.json");
      await fs.writeFile(sp, JSON.stringify(summary, null, 2), "utf-8");
      files.push({ kind: "summary_json", path: sp, bytes: Buffer.byteLength(JSON.stringify(summary)) });

      for (const f of files) Exports.add(projectId, f.kind, f.path, f.bytes);
      Projects.update(projectId, { status: "done" });
      return done(run, { files }, projectId);
    }

    case "ingestion": {
      const concept = getConcept(projectId);
      if (!concept) return fail(newAgentRun(projectId, "ingestion", "james", {}), "Concept missing.");
      const kdp = Kdp.byProject(projectId);
      if (!kdp) return fail(newAgentRun(projectId, "ingestion", "james", {}), "KDP missing.");
      const chapters = Chapters.byProject(projectId);
      const run = newAgentRun(projectId, "ingestion", "james", {});
      // We need the JSON KDP form; rebuild from row
      const kdpJson = {
        title: kdp.title || "",
        subtitle: kdp.subtitle || "",
        description: kdp.description || "",
        keywords: J.parse<string[]>(kdp.keywords, []),
        categories: J.parse<string[]>(kdp.categories, []),
        cover_prompt: kdp.cover_prompt || ""
      };
      const r = await runIngestion(project, concept, kdpJson as never, chapters, run.id);
      if ("error" in r) return fail(run, r.error);
      // Replace any existing knowledge for this project so re-runs are clean
      Knowledge.clearProject(projectId);
      const persisted = await persistKnowledge(projectId, r.data);
      // Save style profile from the DNA
      StyleProfiles.save(projectId, {
        voice: r.data.writing_style_dna.voice,
        cadence: r.data.writing_style_dna.cadence,
        vocabulary: r.data.writing_style_dna.vocabulary,
        recurring_phrases: J.stringify(r.data.writing_style_dna.recurring_phrases),
        pov: r.data.writing_style_dna.pov,
        do_use: J.stringify(r.data.writing_style_dna.do_use),
        do_not_use: J.stringify(r.data.writing_style_dna.do_not_use),
        meta: null
      }, project.series_id ?? null);
      Projects.update(projectId, { status: "done" });
      return done(run, { ...r.data, persisted: persisted.items }, projectId);
    }

    default:
      throw new Error(`Step ${step} not implemented`);
  }

  // Suppress unused warning when default removed in future
  void def;
}

export async function runFullPipeline(projectId: string): Promise<RunResult[]> {
  const sequence: StepId[] = [
    "research", "concept", "structure", "drafting",
    "editorial", "factcheck", "revision",
    "kdp", "export", "ingestion"
  ];
  const out: RunResult[] = [];
  for (const step of sequence) {
    const r = await runStep(projectId, step);
    out.push(r);
    if (!r.ok) break;
  }
  return out;
}

export function snapshotChapters(chapters: ChapterRow[]) {
  return chapters.map((c) => ({
    id: c.id,
    position: c.position,
    heading: c.heading,
    role: c.role,
    target_words: c.target_words,
    status: c.status,
    word_count: c.word_count,
    has_draft: !!c.draft,
    has_revised: !!c.revised
  }));
}
