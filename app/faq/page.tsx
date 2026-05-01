import Link from "next/link";

export const metadata = { title: "FAQ — BookBrain OS" };

interface QA { q: string; a: React.ReactNode }

const QAS: QA[] = [
  {
    q: "What does BookBrain OS actually do?",
    a: <>You enter one book idea. A 10-step pipeline produces a full manuscript, KDP listing, and print-ready cover. Every finished book is distilled into reusable knowledge so the next book inherits your voice.</>
  },
  {
    q: "Is the output good enough to publish?",
    a: <>It's a strong first draft and a complete launch package. Treat it like a ghostwriter — review and approve before publishing.</>
  },
  {
    q: "Where does my data live?",
    a: <>Self-hosted: entirely on your machine — SQLite, your filesystem, and direct API calls to model providers using your keys.</>
  },
  {
    q: "What does it cost to use?",
    a: <>The OS itself: lifetime ¥29,800–¥98,000, or subscription ¥9,800–¥29,800/mo. Provider API spend: ~$1–6 per finished book, paid directly to OpenAI / Anthropic / Google. <Link href="/estimate" className="underline">Live estimator →</Link></>
  },
  {
    q: "Which providers do I need?",
    a: <>All three for the full pipeline: OpenAI, Anthropic, Google. The system tolerates one missing — that step fails gracefully and you can run the others.</>
  },
  {
    q: "What languages does it support?",
    a: <>Any language the underlying models support (English, Japanese, Spanish, French, German, Chinese tested). For Japanese books, the KDP step also produces romanized title and furigana.</>
  },
  {
    q: "Can it generate the actual cover image?",
    a: <>Yes. Cover Studio calls gpt-image-1 (with dall-e-3 fallback). You can also upload your own image. Either way, Cover Studio composites text overlays and outputs ebook PNG/JPG and paperback wraparound PDF.</>
  },
  {
    q: "Does the paperback PDF actually meet KDP requirements?",
    a: <>Yes. Spine width is computed using KDP's per-paper-type formulas. Bleed, safe zone, and barcode reserve are correct. PDF dimensions match exact print size at 300 DPI.</>
  },
  {
    q: "How does the knowledge base work?",
    a: <>Ingestion distills every finished book into typed items (book summary, chapter summaries, concepts, arguments, style DNA, series rules, metaphors, citations, lessons). Items are embedded with text-embedding-3-small and stored locally. New books pull relevant past content via cosine similarity.</>
  },
  {
    q: "Do I need Stripe to use it?",
    a: <>No. License keys are issued offline via the CLI. Stripe is optional and only relevant for self-serve checkout.</>
  },
  {
    q: "How do I back up?",
    a: <>Settings → Download backup produces a single ZIP of the SQLite DB plus the exports directory.</>
  },
  {
    q: "How do I cancel a subscription?",
    a: <><Link href="/billing" className="underline">/billing</Link> → Open Stripe portal → Cancel. The license remains active until the end of the current billing period.</>
  },
  {
    q: "How do I get a refund?",
    a: <>Beta lifetime sales are non-refundable except in cases of critical malfunction that prevents installation or running. Subscriptions can be canceled any time at <Link href="/billing" className="underline">/billing</Link>. <Link href="/refund" className="underline">Full policy →</Link></>
  }
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Back</Link>
      <h1 className="text-3xl font-bold mt-2 mb-2">Frequently asked questions</h1>
      <p className="text-zinc-400 text-sm mb-8">
        See <Link href="/guide" className="underline">/guide</Link> for the full usage walkthrough and{" "}
        <Link href="/pricing" className="underline">/pricing</Link> for plan details.
      </p>

      <div className="space-y-4">
        {QAS.map((qa, i) => (
          <details key={i} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <summary className="cursor-pointer font-semibold">{qa.q}</summary>
            <div className="mt-3 text-sm text-zinc-300 leading-relaxed">{qa.a}</div>
          </details>
        ))}
      </div>
    </main>
  );
}
