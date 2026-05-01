import Link from "next/link";

export const metadata = { title: "Changelog — BookBrain OS" };

export default function ChangelogPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Back</Link>
      <h1 className="text-3xl font-bold mt-2 mb-8">Changelog</h1>

      <section className="mb-10">
        <Tag>v1.0</Tag>
        <h2 className="text-xl font-semibold mt-2">Sellable v1</h2>
        <ul className="list-disc list-inside text-sm text-zinc-300 mt-2 space-y-1">
          <li>Onboarding wizard with API key entry, connection tests, license activation, and sample project.</li>
          <li>HMAC-signed license keys with 4 plans (Free, Starter, Pro, Studio).</li>
          <li>Stripe Checkout, customer portal, and webhook-driven license issuance.</li>
          <li>Settings page: API keys, models, cost limit, defaults, demo mode, backup.</li>
          <li>Project quota and monthly cost guards on agent runs and AI cover generation.</li>
          <li>Diagnostics page with provider connectivity, storage, counts, stuck-run recovery.</li>
          <li>Backup endpoint produces a single ZIP of the SQLite DB and exports folder.</li>
          <li>Project duplicate, delete, and full-project ZIP export.</li>
          <li>Billing, license, terms, privacy, and refund pages.</li>
        </ul>
      </section>

      <section className="mb-10">
        <Tag>v0.4</Tag>
        <h2 className="text-xl font-semibold mt-2">Cover Studio v2</h2>
        <ul className="list-disc list-inside text-sm text-zinc-300 mt-2 space-y-1">
          <li>Real cover image rendering: ebook PNG/JPG and paperback wraparound PDF.</li>
          <li>Image upload + AI generation via gpt-image-1 with DALL·E 3 fallback.</li>
          <li>Text overlays for title, subtitle, author, spine, and back-cover text.</li>
          <li>Bleed, safe zone, spine fold, and barcode reserve guides.</li>
          <li>Series profiles UI, style DNA picker, similar-work and duplicate-theme detection.</li>
        </ul>
      </section>

      <section className="mb-10">
        <Tag>v0.3</Tag>
        <h2 className="text-xl font-semibold mt-2">Knowledge accumulation</h2>
        <ul className="list-disc list-inside text-sm text-zinc-300 mt-2 space-y-1">
          <li>Ingestion agent distills finished books into reusable knowledge items.</li>
          <li>Embeddings via text-embedding-3-small, cosine similarity retrieval.</li>
          <li>Knowledge auto-threaded into prompts for new projects.</li>
        </ul>
      </section>

      <section className="mb-10">
        <Tag>v0.2</Tag>
        <h2 className="text-xl font-semibold mt-2">BookBrain core</h2>
        <ul className="list-disc list-inside text-sm text-zinc-300 mt-2 space-y-1">
          <li>10-step pipeline: research → concept → structure → drafting → editorial → factcheck → revision → KDP → export → ingestion.</li>
          <li>14-table SQLite schema with typed accessors.</li>
          <li>Cost tracking per provider/model/run.</li>
        </ul>
      </section>

      <section>
        <Tag>v0.1</Tag>
        <h2 className="text-xl font-semibold mt-2">TriBrain OS council</h2>
        <p className="text-sm text-zinc-300 mt-2">
          Three-AI parallel council with synthesis and debate, now living at <code>/tribrain</code>.
        </p>
      </section>
    </main>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-zinc-700 px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
      {children}
    </span>
  );
}
