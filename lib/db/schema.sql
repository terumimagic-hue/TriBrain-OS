-- BookBrain OS schema
-- Single-user local-first; user_id is always 1 unless multi-user is added.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'James',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT OR IGNORE INTO user (id, name) VALUES (1, 'James');

CREATE TABLE IF NOT EXISTS series_profile (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user(id),
  name TEXT NOT NULL,
  description TEXT,
  tone TEXT,
  rules TEXT,                 -- JSON: continuity rules
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS book_project (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES user(id),
  series_id TEXT REFERENCES series_profile(id),
  title TEXT,                  -- decided by KDP step; may be null early
  working_title TEXT NOT NULL, -- user's initial idea
  idea TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  market TEXT NOT NULL DEFAULT 'US',
  tone TEXT,
  estimated_words INTEGER,
  reference_books TEXT,        -- JSON array of strings
  status TEXT NOT NULL DEFAULT 'created', -- created | running | done | error
  current_step TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_run (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES book_project(id) ON DELETE CASCADE,
  step TEXT NOT NULL,                -- research | concept | structure | drafting | editorial | factcheck | revision | kdp | export | ingestion | cover
  agent TEXT NOT NULL,               -- gemini | claude | james
  status TEXT NOT NULL DEFAULT 'pending', -- pending | running | done | error
  attempt INTEGER NOT NULL DEFAULT 0,
  input TEXT,                        -- JSON
  output TEXT,                       -- JSON
  error TEXT,
  started_at TEXT,
  finished_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_run_project ON agent_run(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_run_step ON agent_run(project_id, step);

CREATE TABLE IF NOT EXISTS research_note (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES book_project(id) ON DELETE CASCADE,
  market_demand TEXT,
  competing_books TEXT,    -- JSON
  reader_pain_points TEXT, -- JSON
  search_intent TEXT,
  context_notes TEXT,
  unique_angle TEXT,
  credibility_notes TEXT,
  risk_notes TEXT,
  raw TEXT,                -- full JSON snapshot
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS source_reference (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES book_project(id) ON DELETE CASCADE,
  title TEXT,
  url TEXT,
  citation TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chapter (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES book_project(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  heading TEXT NOT NULL,
  role TEXT,                  -- e.g., "opening", "core argument", "case study"
  outline TEXT,
  target_words INTEGER,
  draft TEXT,                 -- latest draft text
  revised TEXT,               -- after revision
  status TEXT NOT NULL DEFAULT 'pending', -- pending | drafted | edited | revised
  word_count INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_chapter_project ON chapter(project_id, position);

CREATE TABLE IF NOT EXISTS manuscript_version (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES book_project(id) ON DELETE CASCADE,
  label TEXT NOT NULL,         -- "draft v1", "post-revision v1", etc.
  content TEXT NOT NULL,       -- full manuscript markdown
  word_count INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS editorial_note (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES book_project(id) ON DELETE CASCADE,
  chapter_id TEXT REFERENCES chapter(id) ON DELETE CASCADE,
  category TEXT NOT NULL,      -- clarity | structure | tone | repetition | weak | commercial | factcheck
  severity TEXT NOT NULL DEFAULT 'medium', -- low | medium | high
  text TEXT NOT NULL,
  suggested_fix TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS kdp_metadata (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES book_project(id) ON DELETE CASCADE,
  title TEXT,
  subtitle TEXT,
  romanized_title TEXT,
  furigana TEXT,
  author_bio TEXT,
  description TEXT,
  keywords TEXT,                -- JSON: array of 7
  categories TEXT,              -- JSON: array
  pricing TEXT,                 -- JSON: {usd, jpy, etc.}
  kindle_select BOOLEAN,
  aplus_content TEXT,
  launch_copy TEXT,
  social_posts TEXT,            -- JSON: array
  cover_prompt TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS export_file (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES book_project(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,           -- manuscript_md | manuscript_docx | kdp_md | research_md | editorial_md | cover_pdf | cover_metadata | aplus_md | summary_json
  path TEXT NOT NULL,
  bytes INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS knowledge_item (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES book_project(id) ON DELETE SET NULL, -- which book it came from
  kind TEXT NOT NULL,           -- chapter_summary | concept | argument | metaphor | tone | series_rule | reader_promise | title_pattern | kdp_position | citation | lesson
  title TEXT,
  content TEXT NOT NULL,
  meta TEXT,                    -- JSON
  embedding TEXT,               -- JSON array of floats (TEXT for portability)
  embedding_model TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_knowledge_kind ON knowledge_item(kind);
CREATE INDEX IF NOT EXISTS idx_knowledge_project ON knowledge_item(project_id);

CREATE TABLE IF NOT EXISTS style_profile (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES book_project(id) ON DELETE SET NULL,
  series_id TEXT REFERENCES series_profile(id),
  voice TEXT,
  cadence TEXT,
  vocabulary TEXT,
  recurring_phrases TEXT,    -- JSON
  pov TEXT,                  -- 1st/2nd/3rd
  do_use TEXT,               -- JSON
  do_not_use TEXT,           -- JSON
  meta TEXT,                 -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cost_log (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES book_project(id) ON DELETE SET NULL,
  agent_run_id TEXT REFERENCES agent_run(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  estimated_usd REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_cost_project ON cost_log(project_id);
