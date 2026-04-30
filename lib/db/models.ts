import { getDB, newId } from "./client";

// Generic JSON helpers
export const J = {
  stringify: (v: unknown) => (v == null ? null : JSON.stringify(v)),
  parse<T>(v: unknown, fallback: T): T {
    if (v == null) return fallback;
    try {
      return JSON.parse(v as string) as T;
    } catch {
      return fallback;
    }
  }
};

export interface BookProjectRow {
  id: string;
  user_id: number;
  series_id: string | null;
  title: string | null;
  working_title: string;
  idea: string;
  language: string;
  market: string;
  tone: string | null;
  estimated_words: number | null;
  reference_books: string | null;
  status: "created" | "running" | "done" | "error";
  current_step: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  workingTitle: string;
  idea: string;
  language?: string;
  market?: string;
  tone?: string;
  estimatedWords?: number;
  referenceBooks?: string[];
  seriesId?: string | null;
}

export const Projects = {
  create(input: CreateProjectInput): BookProjectRow {
    const db = getDB();
    const id = newId("bp");
    db.prepare(
      `INSERT INTO book_project
         (id, user_id, series_id, working_title, idea, language, market, tone, estimated_words, reference_books)
       VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      input.seriesId ?? null,
      input.workingTitle,
      input.idea,
      input.language ?? "en",
      input.market ?? "US",
      input.tone ?? null,
      input.estimatedWords ?? null,
      J.stringify(input.referenceBooks ?? [])
    );
    return Projects.get(id)!;
  },
  get(id: string): BookProjectRow | null {
    return (getDB().prepare("SELECT * FROM book_project WHERE id = ?").get(id) as BookProjectRow) ?? null;
  },
  list(): BookProjectRow[] {
    return getDB().prepare("SELECT * FROM book_project ORDER BY created_at DESC").all() as BookProjectRow[];
  },
  update(id: string, patch: Partial<BookProjectRow>): void {
    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      if (k === "id") continue;
      fields.push(`${k} = ?`);
      values.push(v);
    }
    if (!fields.length) return;
    fields.push("updated_at = datetime('now')");
    values.push(id);
    getDB().prepare(`UPDATE book_project SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  },
  setStep(id: string, step: string, status: BookProjectRow["status"] = "running"): void {
    Projects.update(id, { current_step: step, status });
  }
};

export interface AgentRunRow {
  id: string;
  project_id: string;
  step: string;
  agent: string;
  status: "pending" | "running" | "done" | "error";
  attempt: number;
  input: string | null;
  output: string | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export const AgentRuns = {
  create(projectId: string, step: string, agent: string, input: unknown): AgentRunRow {
    const db = getDB();
    const id = newId("run");
    db.prepare(
      `INSERT INTO agent_run (id, project_id, step, agent, status, attempt, input, started_at)
       VALUES (?, ?, ?, ?, 'running', 1, ?, datetime('now'))`
    ).run(id, projectId, step, agent, J.stringify(input));
    return AgentRuns.get(id)!;
  },
  get(id: string): AgentRunRow | null {
    return (getDB().prepare("SELECT * FROM agent_run WHERE id = ?").get(id) as AgentRunRow) ?? null;
  },
  finish(id: string, output: unknown): void {
    getDB().prepare(
      "UPDATE agent_run SET status='done', output=?, finished_at=datetime('now') WHERE id = ?"
    ).run(J.stringify(output), id);
  },
  fail(id: string, err: string): void {
    getDB().prepare(
      "UPDATE agent_run SET status='error', error=?, finished_at=datetime('now') WHERE id = ?"
    ).run(err, id);
  },
  latest(projectId: string, step: string): AgentRunRow | null {
    return (
      (getDB()
        .prepare("SELECT * FROM agent_run WHERE project_id = ? AND step = ? ORDER BY created_at DESC LIMIT 1")
        .get(projectId, step) as AgentRunRow) ?? null
    );
  },
  byProject(projectId: string): AgentRunRow[] {
    return getDB()
      .prepare("SELECT * FROM agent_run WHERE project_id = ? ORDER BY created_at DESC")
      .all(projectId) as AgentRunRow[];
  }
};

export interface ChapterRow {
  id: string;
  project_id: string;
  position: number;
  heading: string;
  role: string | null;
  outline: string | null;
  target_words: number | null;
  draft: string | null;
  revised: string | null;
  status: "pending" | "drafted" | "edited" | "revised";
  word_count: number | null;
}

export const Chapters = {
  upsert(projectId: string, position: number, heading: string, role: string, outline: string, targetWords: number): ChapterRow {
    const db = getDB();
    const existing = db
      .prepare("SELECT * FROM chapter WHERE project_id = ? AND position = ?")
      .get(projectId, position) as ChapterRow | undefined;
    if (existing) {
      db.prepare(
        "UPDATE chapter SET heading=?, role=?, outline=?, target_words=?, updated_at=datetime('now') WHERE id=?"
      ).run(heading, role, outline, targetWords, existing.id);
      return Chapters.get(existing.id)!;
    }
    const id = newId("ch");
    db.prepare(
      `INSERT INTO chapter (id, project_id, position, heading, role, outline, target_words)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, projectId, position, heading, role, outline, targetWords);
    return Chapters.get(id)!;
  },
  get(id: string): ChapterRow | null {
    return (getDB().prepare("SELECT * FROM chapter WHERE id = ?").get(id) as ChapterRow) ?? null;
  },
  byProject(projectId: string): ChapterRow[] {
    return getDB()
      .prepare("SELECT * FROM chapter WHERE project_id = ? ORDER BY position ASC")
      .all(projectId) as ChapterRow[];
  },
  setDraft(id: string, draft: string): void {
    const wc = draft.split(/\s+/).filter(Boolean).length;
    getDB().prepare(
      "UPDATE chapter SET draft=?, status='drafted', word_count=?, updated_at=datetime('now') WHERE id=?"
    ).run(draft, wc, id);
  },
  setRevised(id: string, revised: string): void {
    const wc = revised.split(/\s+/).filter(Boolean).length;
    getDB().prepare(
      "UPDATE chapter SET revised=?, status='revised', word_count=?, updated_at=datetime('now') WHERE id=?"
    ).run(revised, wc, id);
  },
  clear(projectId: string): void {
    getDB().prepare("DELETE FROM chapter WHERE project_id = ?").run(projectId);
  }
};

export interface ResearchNoteRow {
  id: string;
  project_id: string;
  market_demand: string | null;
  competing_books: string | null;
  reader_pain_points: string | null;
  search_intent: string | null;
  context_notes: string | null;
  unique_angle: string | null;
  credibility_notes: string | null;
  risk_notes: string | null;
  raw: string | null;
}

export const ResearchNotes = {
  save(projectId: string, data: Omit<ResearchNoteRow, "id" | "project_id">): ResearchNoteRow {
    const db = getDB();
    db.prepare("DELETE FROM research_note WHERE project_id = ?").run(projectId);
    const id = newId("rn");
    db.prepare(
      `INSERT INTO research_note
        (id, project_id, market_demand, competing_books, reader_pain_points, search_intent,
         context_notes, unique_angle, credibility_notes, risk_notes, raw)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, projectId,
      data.market_demand, data.competing_books, data.reader_pain_points,
      data.search_intent, data.context_notes, data.unique_angle,
      data.credibility_notes, data.risk_notes, data.raw
    );
    return ResearchNotes.byProject(projectId)!;
  },
  byProject(projectId: string): ResearchNoteRow | null {
    return (getDB()
      .prepare("SELECT * FROM research_note WHERE project_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(projectId) as ResearchNoteRow) ?? null;
  }
};

export interface EditorialNoteRow {
  id: string;
  project_id: string;
  chapter_id: string | null;
  category: string;
  severity: "low" | "medium" | "high";
  text: string;
  suggested_fix: string | null;
}

export const EditorialNotes = {
  add(projectId: string, note: Omit<EditorialNoteRow, "id" | "project_id">): EditorialNoteRow {
    const db = getDB();
    const id = newId("en");
    db.prepare(
      `INSERT INTO editorial_note (id, project_id, chapter_id, category, severity, text, suggested_fix)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, projectId, note.chapter_id, note.category, note.severity, note.text, note.suggested_fix);
    return { id, project_id: projectId, ...note } as EditorialNoteRow;
  },
  byProject(projectId: string): EditorialNoteRow[] {
    return getDB().prepare("SELECT * FROM editorial_note WHERE project_id = ? ORDER BY created_at DESC")
      .all(projectId) as EditorialNoteRow[];
  },
  clearForChapter(chapterId: string): void {
    getDB().prepare("DELETE FROM editorial_note WHERE chapter_id = ?").run(chapterId);
  }
};

export interface KdpRow {
  id: string;
  project_id: string;
  title: string | null;
  subtitle: string | null;
  romanized_title: string | null;
  furigana: string | null;
  author_bio: string | null;
  description: string | null;
  keywords: string | null;
  categories: string | null;
  pricing: string | null;
  kindle_select: number | null;
  aplus_content: string | null;
  launch_copy: string | null;
  social_posts: string | null;
  cover_prompt: string | null;
}

export const Kdp = {
  save(projectId: string, data: Omit<KdpRow, "id" | "project_id">): KdpRow {
    const db = getDB();
    db.prepare("DELETE FROM kdp_metadata WHERE project_id = ?").run(projectId);
    const id = newId("kdp");
    db.prepare(
      `INSERT INTO kdp_metadata
        (id, project_id, title, subtitle, romanized_title, furigana, author_bio, description,
         keywords, categories, pricing, kindle_select, aplus_content, launch_copy, social_posts, cover_prompt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, projectId, data.title, data.subtitle, data.romanized_title, data.furigana,
      data.author_bio, data.description, data.keywords, data.categories, data.pricing,
      data.kindle_select, data.aplus_content, data.launch_copy, data.social_posts, data.cover_prompt
    );
    return Kdp.byProject(projectId)!;
  },
  byProject(projectId: string): KdpRow | null {
    return (getDB().prepare("SELECT * FROM kdp_metadata WHERE project_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(projectId) as KdpRow) ?? null;
  }
};

export interface ManuscriptVersionRow {
  id: string;
  project_id: string;
  label: string;
  content: string;
  word_count: number | null;
  created_at: string;
}

export const Manuscripts = {
  add(projectId: string, label: string, content: string): ManuscriptVersionRow {
    const db = getDB();
    const id = newId("ms");
    const wc = content.split(/\s+/).filter(Boolean).length;
    db.prepare(
      "INSERT INTO manuscript_version (id, project_id, label, content, word_count) VALUES (?, ?, ?, ?, ?)"
    ).run(id, projectId, label, content, wc);
    return Manuscripts.get(id)!;
  },
  get(id: string): ManuscriptVersionRow | null {
    return (getDB().prepare("SELECT * FROM manuscript_version WHERE id = ?").get(id) as ManuscriptVersionRow) ?? null;
  },
  latest(projectId: string): ManuscriptVersionRow | null {
    return (getDB()
      .prepare("SELECT * FROM manuscript_version WHERE project_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(projectId) as ManuscriptVersionRow) ?? null;
  },
  byProject(projectId: string): ManuscriptVersionRow[] {
    return getDB()
      .prepare("SELECT * FROM manuscript_version WHERE project_id = ? ORDER BY created_at DESC")
      .all(projectId) as ManuscriptVersionRow[];
  }
};

export interface KnowledgeItemRow {
  id: string;
  project_id: string | null;
  kind: string;
  title: string | null;
  content: string;
  meta: string | null;
  embedding: string | null;
  embedding_model: string | null;
  created_at: string;
}

export const Knowledge = {
  add(projectId: string | null, kind: string, title: string | null, content: string, meta: unknown, embedding?: number[], embeddingModel?: string): KnowledgeItemRow {
    const db = getDB();
    const id = newId("k");
    db.prepare(
      `INSERT INTO knowledge_item (id, project_id, kind, title, content, meta, embedding, embedding_model)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, projectId, kind, title, content, J.stringify(meta),
      embedding ? J.stringify(embedding) : null,
      embeddingModel ?? null
    );
    return Knowledge.get(id)!;
  },
  get(id: string): KnowledgeItemRow | null {
    return (getDB().prepare("SELECT * FROM knowledge_item WHERE id = ?").get(id) as KnowledgeItemRow) ?? null;
  },
  list(filter: { kind?: string; projectId?: string } = {}): KnowledgeItemRow[] {
    const where: string[] = [];
    const args: unknown[] = [];
    if (filter.kind) { where.push("kind = ?"); args.push(filter.kind); }
    if (filter.projectId) { where.push("project_id = ?"); args.push(filter.projectId); }
    const sql = `SELECT * FROM knowledge_item ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC`;
    return getDB().prepare(sql).all(...args) as KnowledgeItemRow[];
  },
  all(): KnowledgeItemRow[] {
    return getDB().prepare("SELECT * FROM knowledge_item").all() as KnowledgeItemRow[];
  },
  clearProject(projectId: string): void {
    getDB().prepare("DELETE FROM knowledge_item WHERE project_id = ?").run(projectId);
  }
};

export interface StyleProfileRow {
  id: string;
  project_id: string | null;
  series_id: string | null;
  voice: string | null;
  cadence: string | null;
  vocabulary: string | null;
  recurring_phrases: string | null;
  pov: string | null;
  do_use: string | null;
  do_not_use: string | null;
  meta: string | null;
}

export const StyleProfiles = {
  save(projectId: string, data: Omit<StyleProfileRow, "id" | "project_id" | "series_id">, seriesId?: string | null): StyleProfileRow {
    const db = getDB();
    db.prepare("DELETE FROM style_profile WHERE project_id = ?").run(projectId);
    const id = newId("sp");
    db.prepare(
      `INSERT INTO style_profile (id, project_id, series_id, voice, cadence, vocabulary, recurring_phrases, pov, do_use, do_not_use, meta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, projectId, seriesId ?? null,
      data.voice, data.cadence, data.vocabulary, data.recurring_phrases, data.pov, data.do_use, data.do_not_use, data.meta
    );
    return StyleProfiles.byProject(projectId)!;
  },
  byProject(projectId: string): StyleProfileRow | null {
    return (getDB().prepare("SELECT * FROM style_profile WHERE project_id = ? ORDER BY created_at DESC LIMIT 1")
      .get(projectId) as StyleProfileRow) ?? null;
  },
  bySeries(seriesId: string): StyleProfileRow[] {
    return getDB().prepare("SELECT * FROM style_profile WHERE series_id = ? ORDER BY created_at DESC").all(seriesId) as StyleProfileRow[];
  }
};

export interface SeriesProfileRow {
  id: string;
  user_id: number;
  name: string;
  description: string | null;
  tone: string | null;
  rules: string | null;
}

export const Series = {
  create(name: string, description?: string, tone?: string, rules?: unknown): SeriesProfileRow {
    const db = getDB();
    const id = newId("sr");
    db.prepare(
      "INSERT INTO series_profile (id, user_id, name, description, tone, rules) VALUES (?, 1, ?, ?, ?, ?)"
    ).run(id, name, description ?? null, tone ?? null, J.stringify(rules ?? null));
    return Series.get(id)!;
  },
  get(id: string): SeriesProfileRow | null {
    return (getDB().prepare("SELECT * FROM series_profile WHERE id = ?").get(id) as SeriesProfileRow) ?? null;
  },
  list(): SeriesProfileRow[] {
    return getDB().prepare("SELECT * FROM series_profile ORDER BY created_at DESC").all() as SeriesProfileRow[];
  }
};

export interface SourceRefRow {
  id: string;
  project_id: string;
  title: string | null;
  url: string | null;
  citation: string | null;
  notes: string | null;
}

export const Sources = {
  add(projectId: string, ref: Omit<SourceRefRow, "id" | "project_id">): SourceRefRow {
    const db = getDB();
    const id = newId("src");
    db.prepare(
      "INSERT INTO source_reference (id, project_id, title, url, citation, notes) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, projectId, ref.title, ref.url, ref.citation, ref.notes);
    return { id, project_id: projectId, ...ref };
  },
  byProject(projectId: string): SourceRefRow[] {
    return getDB().prepare("SELECT * FROM source_reference WHERE project_id = ?").all(projectId) as SourceRefRow[];
  },
  clearProject(projectId: string): void {
    getDB().prepare("DELETE FROM source_reference WHERE project_id = ?").run(projectId);
  }
};

export interface ExportFileRow {
  id: string;
  project_id: string;
  kind: string;
  path: string;
  bytes: number | null;
  created_at: string;
}

export const Exports = {
  add(projectId: string, kind: string, filePath: string, bytes: number): ExportFileRow {
    const db = getDB();
    const id = newId("ex");
    db.prepare("INSERT INTO export_file (id, project_id, kind, path, bytes) VALUES (?, ?, ?, ?, ?)")
      .run(id, projectId, kind, filePath, bytes);
    return { id, project_id: projectId, kind, path: filePath, bytes, created_at: new Date().toISOString() };
  },
  byProject(projectId: string): ExportFileRow[] {
    return getDB().prepare("SELECT * FROM export_file WHERE project_id = ? ORDER BY created_at DESC").all(projectId) as ExportFileRow[];
  }
};

export const Costs = {
  log(projectId: string | null, agentRunId: string | null, provider: string, model: string, inputTokens: number, outputTokens: number, usd: number): void {
    const id = newId("cost");
    getDB().prepare(
      `INSERT INTO cost_log (id, project_id, agent_run_id, provider, model, input_tokens, output_tokens, estimated_usd)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, projectId, agentRunId, provider, model, inputTokens, outputTokens, usd);
  },
  totals(projectId: string): { tokens_in: number; tokens_out: number; usd: number } {
    const row = getDB().prepare(
      `SELECT COALESCE(SUM(input_tokens), 0) AS tokens_in,
              COALESCE(SUM(output_tokens), 0) AS tokens_out,
              COALESCE(SUM(estimated_usd), 0) AS usd
         FROM cost_log WHERE project_id = ?`
    ).get(projectId) as { tokens_in: number; tokens_out: number; usd: number };
    return row;
  }
};
