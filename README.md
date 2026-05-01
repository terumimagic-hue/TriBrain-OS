# BookBrain OS

**AI Publishing Engine.** One idea in. A complete publishing package out —
manuscript, KDP listing, cover. Every finished book teaches the system how to
write the next one.

> Self-hosted v1.0 (beta). Local-first, your API keys, your books, your
> knowledge base. No vendor lock-in.

---

## What it does

You enter a single book idea. BookBrain OS runs a 10-step pipeline:

```
Idea
 → Research        (Gemini)   market, reader, sources, risks
 → Concept         (James)    thesis, promise, go/no-go
 → Structure      (Claude)    TOC, chapter roles, pacing
 → Drafting       (Claude)    full chapter prose
 → Editorial      (James)     diagnosis, severity, fixes
 → Fact Check     (Gemini)    risky and unsupported claims
 → Revision       (Claude)    per-chapter rewrite
 → KDP Package    (James)     title, description, 7 keywords, A+ content
 → Cover Studio   (sharp)     ebook PNG/JPG, paperback wraparound PDF
 → Export         (system)    .docx, .md, reports, ZIP
 → Ingestion      (James)     distill into reusable knowledge
                                     ↓
                          Knowledge base + Style profile
                                     ↓
                            Used by the next book
```

You ship a complete publishing package. The system gets stronger with every
book.

## Headline features

- **3-agent pipeline.** Gemini researches, Claude writes, OpenAI/James
  commercializes. Each step is independent, resumable, retryable.
- **Cover Studio.** Real images, not templates. Ebook (1600×2560 PNG/JPG)
  and paperback wraparound PDF with KDP-accurate spine math, bleed, safe
  zone, and barcode reserve. Upload your own image or generate one with
  `gpt-image-1`.
- **Knowledge accumulation.** Every finished book is distilled into reusable
  knowledge — concepts, style DNA, series rules, metaphors, lessons.
  Embedded with `text-embedding-3-small` and threaded into the next book's
  prompts via cosine similarity.
- **License + Stripe.** HMAC-signed license keys (offline verification),
  4 plans, project quotas, monthly cost caps. `/api/checkout` and webhook
  issue licenses on payment.
- **Onboarding wizard.** API key entry, live connection test, license
  activation, sample project — done in under 10 minutes.
- **Diagnostics.** Provider health, plan, quota, cost, storage, stuck-run
  recovery. Backup the entire install to a single ZIP.
- **Local-first.** SQLite, your API keys, your filesystem. No data leaves
  your machine except the model API calls you authorize.

Plus the original **TriBrain OS** 3-AI council bundled at `/tribrain`.

## Pricing (suggested)

| Plan       | Lifetime    | Subscription   | Books/month  |
| ---------- | ----------- | -------------- | ------------ |
| Free       | —           | —              | 1            |
| Starter    | ¥49,800     | ¥9,800/mo      | 5            |
| Pro        | ¥98,000     | ¥29,800/mo     | 20           |
| Studio     | Contact     | Contact        | unlimited    |

You also pay your model providers directly with your own keys
(roughly **$1–6 per finished book** — see `/estimate`).

Beta launch price: **¥29,800 lifetime** for the first 20 customers.

## Install (5 minutes)

```bash
git clone <your-fork> bookbrain-os
cd bookbrain-os
cp .env.example .env
# Edit .env: paste OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY
npm install
npm run dev
# Open http://localhost:3000 — the onboarding wizard takes over from here.
```

Full guide: [docs/INSTALL_SELF_HOSTED.md](docs/INSTALL_SELF_HOSTED.md)
Customer quick-start: [docs/CUSTOMER_QUICKSTART.md](docs/CUSTOMER_QUICKSTART.md)
Selling it yourself: [docs/SELLER_GUIDE.md](docs/SELLER_GUIDE.md)
FAQ: [docs/FAQ.md](docs/FAQ.md)
Demo video script: [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)

## Tech

Next.js 14 · TypeScript · Tailwind · SQLite (better-sqlite3) · OpenAI ·
Anthropic · Google Generative AI · sharp · pdf-lib · docx · Stripe ·
archiver.

39 routes, 16 SQLite tables, 11 agents.

## License

Commercial license — see [LICENSE](LICENSE).
Single-install, no redistribution. Lifetime plans include 12 months of
updates. Subscription plans include updates while the subscription is
active.

## Status

v1.0.0-beta.1 — feature-complete and ready for paid beta sales. See
[CHANGELOG.md](CHANGELOG.md).

## Contact

Issues, license recovery, refunds: see [SELLER_GUIDE.md](docs/SELLER_GUIDE.md).
