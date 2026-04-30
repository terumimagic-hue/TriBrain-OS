# BookBrain OS

BookBrain OS is a fully automated AI book creation and knowledge accumulation system.
It turns one book idea into a complete publishing package using specialized AI agents:

- **Gemini** — research, market analysis, fact checking
- **Claude** — structure, chapter planning, long-form drafting, revision
- **OpenAI / James** — concept, editorial, KDP packaging, knowledge ingestion

Every completed book is analyzed and stored as reusable knowledge so future books
inherit the author's style DNA, recurring concepts, series rules, and KDP positioning.

The repo also bundles **TriBrain OS** at `/tribrain` — the parallel-AI council
(ChatGPT + Claude + Gemini answer one question side-by-side, then synthesize).

## Pipeline

```
Idea
 → Research          (Gemini)   market, reader, sources, risks
 → Concept           (James)    thesis, promise, go/no-go
 → Structure         (Claude)   TOC, chapter roles, pacing
 → Drafting          (Claude)   per-chapter prose
 → Editorial         (James)    diagnosis, severity, fixes
 → Fact Check        (Gemini)   factual / risky claims
 → Revision          (Claude)   per-chapter rewrite
 → KDP Package       (James)    title, description, 7 keywords, A+, cover prompt
 → Export            (system)   .md, .docx, reports, summary.json
 → Ingestion         (James)    distill into reusable knowledge
                                                ↓
                                     Knowledge base + Style profile
                                                ↓
                                       Used by the next book
```

Each step is **independent**, **resumable**, and **retryable**. Every agent run
records its input, output, latency, and cost in SQLite.

## Cover Studio

`/projects/:id/cover` exposes a Cover Studio that:

- **Ebook**: fixed 1600 × 2560 px preset.
- **Paperback**: arbitrary trim size (presets: 5×8, 5.5×8.5, 6×9, 7×10, 8.5×11, plus custom).
  Computes spine width from page count + paper type (KDP-accurate),
  total wraparound dimensions, 300 DPI pixel size, safe zone, bleed,
  and an optional barcode-reserve area.
- Outputs a print-ready template **PDF** with bleed/safe/spine guides,
  plus a **metadata JSON**.

## Tech

- Next.js 14 / TypeScript / Tailwind
- SQLite via `better-sqlite3` (no external DB)
- OpenAI, Anthropic, Google Generative AI SDKs
- Embeddings via `text-embedding-3-small`, cosine similarity in JS
- `docx` for Word export, `pdf-lib` for cover PDFs

## Setup

```bash
cp .env.example .env
# Fill OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY

npm install
npm run dev
```

Open http://localhost:3000 and click **New book**.
Or seed a demo project:

```bash
npm run seed
```

## Project layout

```
app/
  page.tsx                    BookBrain dashboard
  projects/new/page.tsx       Create project
  projects/[id]/page.tsx      Pipeline / manuscript / KDP / research / cover / exports
  knowledge/page.tsx          Search the knowledge base
  tribrain/page.tsx           TriBrain OS (3-AI council)
  api/projects/...            Project CRUD, run a step, manuscript, exports, cover
  api/knowledge                List + semantic search
  api/cover/preview            Live dimension calculator
  api/council                  TriBrain endpoint
lib/
  db/schema.sql               14 tables
  db/client.ts, models.ts     better-sqlite3 + typed accessors
  providers/                  OpenAI / Anthropic / Gemini + cost
  agents/                     12 agents (research → ingestion + retrieval)
  pipeline/steps.ts, runner.ts
  export/markdown.ts, docx.ts
  cover/dimensions.ts, pdf.ts
data/
  bookbrain.db                SQLite (created on first run)
  exports/<project_id>/       Generated .md / .docx / .pdf
```

## Database (14 models)

`user`, `series_profile`, `book_project`, `agent_run`, `chapter`,
`manuscript_version`, `research_note`, `editorial_note`, `kdp_metadata`,
`export_file`, `knowledge_item`, `style_profile`, `source_reference`, `cost_log`.

See `lib/db/schema.sql`.

## Pricing notes

`lib/providers/cost.ts` keeps an editable per-model price table.
`cost_log` records every call (provider, model, input/output tokens, USD estimate).
The dashboard shows live cost per project.

## Replacing agents

Each agent is a single module under `lib/agents/`. To replace one (e.g. swap
the Editorial agent to Claude), open the module, change the `ask`/`askJSON`
agent name, and redeploy. The pipeline runner reads the step → agent map from
`lib/pipeline/steps.ts`.

## Re-running and resuming

- Per-step buttons in the UI re-run any step. The runner reads the latest
  outputs of upstream steps from the DB, so you can edit chapters by hand
  and re-run only Editorial / Revision / KDP / Export.
- "Run all" runs the full pipeline sequentially and stops on the first error.

## Knowledge accumulation

When **Ingestion** runs, the book is distilled into reusable items
(book summary, concepts, arguments, style DNA, series rules, metaphors,
citations, lessons learned). Each item is embedded with
`text-embedding-3-small` and stored in `knowledge_item.embedding`.

When you create a **new** project, every step pulls relevant knowledge
via cosine similarity, excluding the current project. The result is that
future books gradually inherit the author's voice, avoid repeating
themselves, and stay consistent within a series.

## Caveats

- Native bindings: `better-sqlite3` requires a build toolchain. On Linux/macOS
  this is automatic; Windows may need `windows-build-tools`.
- Long-running steps (drafting an entire manuscript) can take minutes. Each
  chapter is a separate API call; partial progress is persisted.
- Pricing in `cost.ts` is a public-estimate table; verify against current
  provider docs.
