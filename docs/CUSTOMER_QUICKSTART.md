# Customer quick start

You'll have your first book package in about 10 minutes of your time, plus
30–90 minutes for the AI to actually write the manuscript while you do
something else.

## 0. Before you start

You need:

- A computer that can run Node.js (Mac, Windows, or Linux)
- An OpenAI API key
- An Anthropic API key
- A Google Gemini API key

The wizard tells you exactly where to get each one, and you can paste them
in without restarting anything.

## 1. Install (5 minutes)

Follow the platform-specific steps in
[INSTALL_SELF_HOSTED.md](INSTALL_SELF_HOSTED.md). Short version:

```bash
git clone <source>/bookbrain-os.git
cd bookbrain-os
cp .env.example .env
npm install
npm run dev
# open http://localhost:3000
```

The first visit takes you to the **onboarding wizard**.

## 2. Onboarding (3 minutes)

Six small steps:

1. **Welcome** — read the one-screen overview.
2. **API keys** — paste your three keys.
3. **Connection test** — click "Test" next to each provider. Green dots
   mean you're good. Red dot? The error message names the cause
   (typo, no credit, wrong region…).
4. **License** — paste the key your seller emailed you. If you skip this,
   you start on the **Free** plan (1 book/month).
5. **Sample** — optional. Click to create a small starter project so you
   can run the pipeline once on something low-stakes.
6. **Done** — click "Open dashboard."

You're in.

## 3. Create your first book (1 minute)

Click **New book**. Fill the form:

| Field           | Tip                                                            |
| --------------- | -------------------------------------------------------------- |
| Working title   | Doesn't have to be the final title. The AI will refine it.     |
| Idea            | 3–6 sentences. Who it's for, what it argues, the unique angle. |
| Language        | Output language (en / ja / es / …)                             |
| Target market   | Amazon storefront (US / JP / UK / DE / FR)                     |
| Tone            | "direct, no-fluff, second person" works well for non-fiction   |
| Target length   | 22,000–35,000 is a good range for Kindle non-fiction          |
| Series / Style  | Pick a previous book's style profile to inherit voice          |

The form warns if your idea is suspiciously close to a book you already
finished. It also shows live cost estimate before you click Create.

## 4. Run the pipeline (30–90 minutes total)

Two ways:

- **Run all** — runs the full pipeline end-to-end and stops on first error.
- **Per step** — click each step's button. Useful if you want to read the
  output before letting it move on.

Recommended on your first book:

1. **Research** — read the unique-angle section. If it's wrong, edit your
   idea and re-run.
2. **Concept** — read the go/no-go. If James says "pivot", listen.
3. **Structure** — open the Manuscript tab. You'll see the chapter list
   with target word counts. Reorder or rename if you want, then move on.
4. **Drafting** — slowest step. Each chapter is a separate API call;
   partial progress is saved. You can leave it running.
5. **Editorial** + **Fact Check** — quick.
6. **Revision** — applies notes per chapter.
7. **KDP Package** — produces the title, description, 7 keywords,
   categories, A+ content, and a cover prompt.
8. **Cover Studio** — see step 5 below.
9. **Export** — writes `.docx`, `.md`, reports, and `project_summary.json`.
10. **Ingestion** — distills the finished book into reusable knowledge.
    Future books will inherit the style and avoid repeating themselves.

If a step fails, the button turns red. Click it again to retry. The
underlying state is persisted, so you never lose work.

## 5. Cover Studio (5 minutes)

Open the **Cover Studio** tab on your project.

For an **ebook cover**:

1. Click **AI generate** to call `gpt-image-1` with the cover prompt the
   KDP step produced. Or click **Upload image** and pick a 1600×2560 PNG
   you've already designed.
2. Edit the title, subtitle, and author text. Adjust font size, color, and
   vertical position.
3. Click **Render preview** to see it.
4. Click **Save PNG + JPG** when you're happy. Files land in
   `data/exports/<project_id>/cover/`.

For a **paperback wraparound** (front + spine + back):

1. Switch to the Paperback tab.
2. Pick a trim size (preset or custom) and your real page count.
3. Pick a paper type. Spine width is calculated automatically using KDP's
   formulas.
4. Toggle **Bleed** and **Reserve barcode area** as needed.
5. Same image + text controls as ebook, plus spine text and back-cover
   text.
6. Click **Preview with guides** to see the bleed / safe / spine / barcode
   overlays.
7. Click **Save PDF + PNG** to write the print-ready PDF.

The PDF dimensions match the exact print size at 300 DPI — KDP accepts it
as-is.

## 6. ZIP export (1 click)

On the project header, click **Download ZIP**. You get one file containing:

- `manuscript.md` and `manuscript.docx`
- `kdp_metadata.md`
- `aplus_content.md`
- `cover_prompt.md`
- `research_report.md`
- `editorial_report.md`
- `project_summary.json`
- `cover/ebook_cover.png|jpg` and `cover/paperback_cover.pdf` if you
  generated them
- `project_summary.json`

That ZIP is everything you need to publish.

## 7. Ship to KDP

In Amazon KDP:

1. **Title** — paste from `kdp_metadata.md`.
2. **Subtitle** — paste.
3. **Description** — paste. KDP accepts basic HTML; the description is
   generated as plain text with paragraph breaks.
4. **Keywords** — copy the 7 keywords into the 7 keyword slots.
5. **Categories** — pick the BISAC categories shown.
6. **Manuscript** — upload `manuscript.docx`.
7. **Cover** — upload `cover/ebook_cover.jpg`. For paperback, use
   `cover/paperback_cover.pdf`.
8. **A+ content** — paste sections from `aplus_content.md` into A+
   modules.
9. Submit for review.

That's the loop.

## 8. Make the next book stronger

After Ingestion runs, your finished book becomes searchable knowledge.
Open `/knowledge` to browse it: book summaries, concepts, arguments,
metaphors, citations, lessons learned, and the writing **style DNA**.

When you create your next book, the form lets you pick a Style profile
from any previous book. The pipeline also automatically retrieves
similar past content and threads it into the prompts, which keeps voice
consistent and helps avoid repeating yourself.

Tag related books to a **Series** at `/series` to share continuity rules
across the whole series.

## 9. Settings to know

`/settings` controls everything you'll likely want to tweak:

- **API key overrides** — paste new keys without restarting.
- **Models** — switch e.g. Anthropic to `claude-haiku-4-5` for cheaper
  drafts.
- **Cost limit** — sets a hard monthly USD cap. Once you hit it, agent
  runs and AI cover generation are blocked until next month.
- **Defaults for new books** — author, language, market, trim, paper.
- **Backup** — downloads a clean ZIP of your DB + exports.

## 10. When something breaks

`/diagnostics` is the first place to look. It shows:

- Provider key status
- Active license + plan
- Quota and cost vs. limit
- Storage paths and sizes
- Counts (projects, runs, chapters, knowledge items)
- "Stuck runs" — pipeline calls that started > 10 minutes ago and never
  finished. One button cleans them up.

If the wizard still answers your question after that, see the
Troubleshooting section in [INSTALL_SELF_HOSTED.md](INSTALL_SELF_HOSTED.md).
