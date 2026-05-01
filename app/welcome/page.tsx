import Link from "next/link";

export const metadata = {
  title: "BookBrain OS — AI Publishing Engine"
};

export default function WelcomePage() {
  return (
    <main className="min-h-screen">
      <section className="px-6 py-24 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
          BookBrain <span className="text-zinc-500">OS</span>
        </h1>
        <p className="mt-3 text-zinc-400">AI Publishing Engine</p>
        <p className="mt-8 text-lg md:text-xl text-zinc-200 max-w-2xl mx-auto">
          One idea in. A complete publishing package out — manuscript, KDP listing, cover.
          Every finished book teaches the system how to write the next one.
        </p>
        <div className="mt-10 flex gap-3 justify-center">
          <Link
            href="/projects/new"
            className="rounded-xl bg-white text-black px-6 py-3 text-sm font-medium hover:bg-zinc-200"
          >
            Start a book
          </Link>
          <Link
            href="/guide"
            className="rounded-xl border border-zinc-700 px-6 py-3 text-sm hover:bg-zinc-900"
          >
            How it works
          </Link>
          <Link
            href="/pricing"
            className="rounded-xl border border-zinc-700 px-6 py-3 text-sm hover:bg-zinc-900"
          >
            Pricing
          </Link>
        </div>
      </section>

      <section className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-10">What it produces from a single idea</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Manuscript" body="Per-chapter prose drafted by Claude, edited by James, fact-checked by Gemini, revised, and exported to .md and .docx." />
          <Card title="KDP package" body="Final title, subtitle, full description, 7 keywords, BISAC categories, pricing, A+ content, launch copy, social posts, cover prompt." />
          <Card title="Cover Studio" body="Ebook (1600×2560 PNG/JPG) and paperback wraparound PDF. Upload an image or generate one with AI. Spine, bleed, and barcode reserve are automatic." />
          <Card title="Knowledge memory" body="Every finished book is distilled into reusable knowledge — concepts, style DNA, series rules, metaphors, lessons — embedded and searchable." />
          <Card title="Series consistency" body="Tag a book to a series and it inherits voice, continuity rules, and avoids repeating themes from earlier volumes." />
          <Card title="One-click export" body="Download the full project as a ZIP: manuscript .docx + .md, KDP markdown, research and editorial reports, cover files, project_summary.json." />
        </div>
      </section>

      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-10">The pipeline</h2>
        <ol className="space-y-3 text-sm text-zinc-200">
          {STEPS.map((s, i) => (
            <li key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-4 flex items-center gap-4">
              <span className="text-zinc-500 font-mono w-6">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex-1">
                <div className="font-semibold">{s.label} <span className="text-xs text-zinc-500 font-normal">— {s.agent}</span></div>
                <div className="text-xs text-zinc-400">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="px-6 py-20 text-center">
        <Link
          href="/projects/new"
          className="inline-block rounded-xl bg-white text-black px-8 py-4 text-base font-medium hover:bg-zinc-200"
        >
          Start your first book →
        </Link>
        <div className="mt-4 text-xs text-zinc-500">
          Local-first. API keys stay in your <code>.env</code>. No upload, no account.
        </div>
      </section>
    </main>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-zinc-400">{body}</p>
    </div>
  );
}

const STEPS = [
  { label: "Research", agent: "Gemini", body: "Reader, market, sources, risks." },
  { label: "Concept", agent: "James", body: "Thesis, promise, go/no-go." },
  { label: "Structure", agent: "Claude", body: "TOC, chapter roles, pacing." },
  { label: "Drafting", agent: "Claude", body: "Per-chapter prose." },
  { label: "Editorial", agent: "James", body: "Diagnosis, severity, fixes." },
  { label: "Fact Check", agent: "Gemini", body: "Risky and unsupported claims." },
  { label: "Revision", agent: "Claude", body: "Per-chapter rewrite." },
  { label: "KDP Package", agent: "James", body: "Title, description, 7 keywords, A+, cover prompt." },
  { label: "Cover Studio", agent: "Renderer", body: "Ebook PNG/JPG, paperback wraparound PDF." },
  { label: "Export", agent: "System", body: ".docx, .md, reports, JSON." },
  { label: "Ingestion", agent: "James", body: "Distill into reusable knowledge for future books." }
];
