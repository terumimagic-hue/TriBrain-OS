# Changelog

All notable changes to BookBrain OS are documented here.
Versioning follows semver. Dates are UTC.

## v1.0.0-beta.1 — Sellable beta

The product is feature-complete for self-hosted sale. Headline:

- **Onboarding wizard** at `/onboard`: API key entry, live connection
  test for OpenAI / Anthropic / Gemini, license activation, sample
  project, and a one-click finish.
- **License system**: HMAC-signed keys verified offline. Four plans
  (Free, Starter, Pro, Studio) with monthly project quotas and
  feature flags.
  - CLI: `npm run issue-license -- --plan pro --email customer@example.com`
  - Admin API: `POST /api/license/issue` (gated by `BOOKBRAIN_ADMIN_TOKEN`).
- **Stripe**: `/api/checkout` (one-time + subscription),
  `/api/stripe/webhook` (issues / expires licenses),
  `/api/portal` (Stripe Billing Portal). Pricing page wires every
  configured `STRIPE_PRICE_*` to a working button.
- **Settings**: API key overrides, models, monthly cost limit,
  default author / language / market / trim / paper, demo mode.
- **Guards**: project quota and monthly cost guard wrap project
  creation, run-step, AI cover generation, and ZIP export.
- **Diagnostics**: provider connectivity, plan, quota, cost, storage,
  table counts, and a "stuck runs" recovery button.
- **Backup**: one-click ZIP of SQLite (via `VACUUM INTO`) plus the
  `exports/` folder.
- **Legal pages**: `/terms`, `/privacy`, `/refund`, `/billing`,
  `/changelog`.

## v0.4 — Cover Studio v2

- Real cover image rendering (sharp + SVG overlays + pdf-lib):
  ebook PNG / JPG (1600×2560) and paperback wraparound PDF (any trim,
  KDP-accurate spine math).
- Cover image upload + AI generation (`gpt-image-1` with `dall-e-3`
  fallback).
- Title / subtitle / author / spine / back-cover text overlays with
  font size, color, and vertical position.
- Bleed, safe zone, spine fold, and barcode-reserve guides.
- Series profile UI, style DNA picker, similar-work and
  duplicate-theme detection.

## v0.3 — Knowledge accumulation

- Ingestion agent distills finished books into reusable knowledge
  items (book summary, chapter summaries, concepts, arguments,
  style DNA, series rules, metaphors, citations, lessons).
- Embeddings via `text-embedding-3-small`; cosine similarity in JS
  for retrieval.
- Knowledge auto-threaded into prompts for new projects.

## v0.2 — BookBrain core

- 10-step pipeline: Research → Concept → Structure → Drafting →
  Editorial → Fact Check → Revision → KDP → Export → Ingestion.
- 14-table SQLite schema with typed accessors (better-sqlite3).
- Cost log per provider/model/run, dashboard totals.
- Markdown + DOCX export.

## v0.1 — TriBrain OS

- Three-AI parallel council with synthesis and debate, now living
  at `/tribrain`.
