# FAQ

### What does BookBrain OS actually do?

You enter one book idea. The system runs a 10-step pipeline that produces
a full manuscript, a complete KDP listing (title, description, 7 keywords,
A+ content, cover prompt), and a print-ready cover (ebook PNG/JPG and
paperback wraparound PDF). It then distills the finished book into reusable
knowledge so the *next* book inherits your voice and avoids repetition.

### Is the output good enough to publish?

It's a strong first draft and a complete launch package. Treat it like a
ghostwriter: review, edit, and approve before publishing. The Editorial
and Fact Check steps catch a lot, but you are the publisher of record.

### Who owns the output?

You do, subject to the underlying providers' terms (OpenAI, Anthropic,
Google). BookBrain OS itself claims no ownership of generated content.

### Where does my data live?

Self-hosted: entirely on your machine — SQLite, your filesystem, and
direct API calls to the model providers using your keys. Nothing is sent
to BookBrain OS servers.

Hosted SaaS (when launched): on our infrastructure. We do not train models
on your content. You can export and delete at any time.

### What does it cost to actually use?

Two parts:

- **The OS itself**: lifetime license (¥29,800–¥98,000) or subscription
  (¥9,800–¥29,800/mo).
- **Provider API spend**: roughly **$1–6 per finished book**, paid
  directly to OpenAI / Anthropic / Google with your own keys. Live
  estimator at `/estimate`.

You can set a hard monthly USD cap in Settings.

### Which providers do I need?

All three for the full pipeline: OpenAI (James + embeddings), Anthropic
(Claude), Google (Gemini). The system tolerates one missing — that step
will fail with a clear error and you can run the others.

### What languages does it support?

The pipeline runs in any language the underlying models support (English,
Japanese, Spanish, French, German, Chinese tested). For Japanese books,
the KDP step also produces romanized title and furigana.

### Can I edit chapters by hand?

Today: chapters are persisted in SQLite and surfaced read-only in the UI.
You can edit `chapter.draft` or `chapter.revised` directly via SQL and
re-run downstream steps. A first-class chapter editor is on the roadmap.

### Can it generate the actual cover image?

Yes. Cover Studio calls `gpt-image-1` (with `dall-e-3` as fallback) to
generate the front cover from the prompt the KDP step produces. You can
also upload your own image. Either way, Cover Studio composites text,
spine, and back-cover overlays and outputs ebook PNG/JPG and paperback
wraparound PDF.

### Does the paperback PDF actually meet KDP requirements?

Yes. Spine width is computed using KDP's per-paper-type formulas. Total
cover dimensions include bleed if enabled. The PDF is at exact print
size at 300 DPI, with bleed/safe-zone metadata. Barcode safe area can be
reserved on the back cover. KDP accepts the PDF as-is.

### Is there an offline mode?

Pipeline runs require provider API access. Everything else — manuscript
viewing, exports, cover rendering on existing assets, knowledge search,
settings — works offline.

### How does the knowledge base actually work?

After Ingestion, every finished book becomes a set of small typed items
(book summary, chapter summaries, concepts, arguments, style DNA, series
rules, metaphors, citations, lessons). Each is embedded with
`text-embedding-3-small` and stored in SQLite. When you create a new
book, the system queries the knowledge base by cosine similarity (excluding
the current project) and threads the top hits into the agent prompts.

The result is that book #5 in a series sounds like the same author as
book #1, and you stop accidentally rewriting the same chapter twice.

### What's the license model?

Lifetime: perpetual right to use the version you bought + 12 months of
updates. One primary install + reasonable test/staging copies.
Subscription: right to use while the subscription is active, including
updates released during that period. Single-customer use only — no
redistribution, no reselling hosted access. Full text in
[LICENSE](../LICENSE).

### Do I need Stripe to use it?

No. You can issue your own license keys with `npm run issue-license`. The
system verifies them offline with HMAC. Stripe is optional and only
relevant if you want self-serve checkout.

### How do I back up?

`Settings → Download backup` produces a single ZIP containing a clean
copy of the SQLite DB (via `VACUUM INTO`) plus the entire `exports/`
directory. Schedule a nightly cron in production.

### How do I update?

Lifetime: download the latest release ZIP, unzip over the install,
`npm install && npm run build`, restart. The DB schema is migrated
automatically on app start. Subscriptions on the hosted plan: we update
for you.

### Can I run more than one install?

Lifetime licenses cover one primary production install plus reasonable
test/staging copies for the same Licensee. Different customers need
different licenses.

### Can I sell BookBrain OS to my own customers?

No — that requires a separate written agreement. You can use it to sell
*books*, *services using its output*, or run it for an in-house team.

### How do I cancel a subscription?

`/billing → Open Stripe portal → Cancel`. The license remains active
until the end of the current billing period.

### How do I get a refund?

Beta lifetime sales are non-refundable except in cases of critical
malfunction that prevents the Software from being installed or run on a
supported platform. Subscriptions can be canceled any time at `/billing`;
cancellation takes effect at the end of the current billing period.
Provider API charges are billed by the provider directly using your keys
and are not refundable through us. Full text at `/refund`.
