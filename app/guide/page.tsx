import Link from "next/link";

export const metadata = { title: "Guide — BookBrain OS" };

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/welcome" className="text-xs text-zinc-500 hover:text-zinc-300">← Back</Link>
      <h1 className="text-4xl font-bold mt-3 mb-2">Usage guide</h1>
      <p className="text-zinc-400 mb-10">From installation to your first published-ready package.</p>

      <Section title="1. Set up API keys">
        <p>
          BookBrain OS uses three providers in parallel. Create your <code>.env</code> from the
          template and fill three keys:
        </p>
        <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono overflow-auto">
{`OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...`}
        </pre>
        <ul className="text-sm space-y-1 list-disc list-inside text-zinc-300">
          <li><a className="underline" href="https://platform.openai.com/api-keys" target="_blank">OpenAI keys</a> — used for the James agent and embeddings</li>
          <li><a className="underline" href="https://console.anthropic.com/settings/keys" target="_blank">Anthropic keys</a> — used for the Claude agent</li>
          <li><a className="underline" href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a> — used for Gemini research and fact-check</li>
        </ul>
      </Section>

      <Section title="2. Run it">
        <pre className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-mono">
{`npm install
npm run dev
# open http://localhost:3000`}
        </pre>
        <p>Optional: <code>npm run seed</code> creates a sample series and project to play with.</p>
      </Section>

      <Section title="3. Create a book">
        <ol className="space-y-2 text-sm text-zinc-300 list-decimal list-inside">
          <li>Click <strong>New book</strong>.</li>
          <li>Enter the working title, idea, language, market, and target length.</li>
          <li>Optionally pick a series and a style profile from prior books.</li>
          <li>The form warns if the idea is suspiciously close to an existing book.</li>
          <li>The cost estimator updates live as you change length.</li>
          <li>Click <strong>Create project</strong> — you land on the pipeline view.</li>
        </ol>
      </Section>

      <Section title="4. Run the pipeline">
        <p>
          Each step has its own button. You can <strong>Run all</strong> end-to-end, or run
          steps individually. Every step is resumable: outputs are persisted to SQLite so
          you can re-run any single step without losing prior work.
        </p>
        <p>
          Failed steps stay marked as errors; click them again to retry. Drafting and Revision
          run chapter-by-chapter, so partial progress is preserved if one chapter fails.
        </p>
      </Section>

      <Section title="5. Cover Studio">
        <p>
          Switch to the <strong>Cover Studio</strong> tab. Choose Ebook (1600×2560 PNG/JPG)
          or Paperback (any trim, KDP-accurate spine math, optional bleed and barcode reserve).
        </p>
        <ol className="space-y-2 text-sm text-zinc-300 list-decimal list-inside">
          <li>Upload an image, or click <em>AI generate</em> to call the image API with the
              cover prompt produced by the KDP agent.</li>
          <li>Edit title, subtitle, author, spine text, and back-cover text. Adjust font size,
              color, and vertical position.</li>
          <li>Click <em>Render preview</em> to see it. Click <em>Save</em> to write the final
              files into the project export folder.</li>
        </ol>
      </Section>

      <Section title="6. Knowledge accumulation">
        <p>
          The <strong>Ingestion</strong> step distills the finished book into reusable
          knowledge — concepts, arguments, style DNA, series rules, metaphors, citations,
          lessons learned. Each item is embedded with <code>text-embedding-3-small</code>
          and stored locally.
        </p>
        <p>
          Future projects automatically pull relevant knowledge by cosine similarity (excluding
          the current project), keeping voice consistent and helping the system avoid repeating
          itself across a series.
        </p>
        <p>
          The <strong>/knowledge</strong> page lets you search the accumulated knowledge directly.
          The <strong>/series</strong> page lets you edit series profiles by hand.
        </p>
      </Section>

      <Section title="7. Export">
        <p>
          The <strong>Export</strong> step writes <code>manuscript.md</code>,
          <code>manuscript.docx</code>, KDP markdown, research and editorial reports, and
          <code>project_summary.json</code>. Cover Studio adds PNG/JPG and PDF.
        </p>
        <p>
          Click <strong>Download ZIP</strong> on the project page to get everything in one
          file.
        </p>
      </Section>

      <div className="text-center mt-12">
        <Link href="/projects/new" className="inline-block rounded-xl bg-white text-black px-6 py-3 text-sm font-medium">
          Start a book
        </Link>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-3 text-sm text-zinc-300">{children}</div>
    </section>
  );
}
