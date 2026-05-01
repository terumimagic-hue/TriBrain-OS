import Link from "next/link";

export const metadata = { title: "Pricing — BookBrain OS" };

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link href="/welcome" className="text-xs text-zinc-500 hover:text-zinc-300">← Back</Link>
      <h1 className="text-4xl font-bold mt-3 mb-2">Pricing</h1>
      <p className="text-zinc-400 mb-10 max-w-2xl">
        BookBrain OS runs locally with your own API keys. You only pay the underlying model
        providers — no platform markup, no seat fees, no per-book licensing.
      </p>

      <div className="grid gap-4 md:grid-cols-3 mb-16">
        <Tier
          name="Self-hosted"
          price="Free"
          tagline="The OS itself."
          features={[
            "All 11 pipeline steps",
            "Cover Studio (PNG/JPG/PDF)",
            "Knowledge accumulation + RAG",
            "Series + style profiles",
            "Local SQLite, local exports",
            "TriBrain OS council included"
          ]}
          cta="Get started"
          href="/projects/new"
        />
        <Tier
          name="Per-book usage"
          price="$1–6"
          tagline="Estimated provider spend per finished book."
          highlight
          features={[
            "Research + Concept: ~$0.10",
            "Structure: ~$0.05",
            "Drafting (~30k words): ~$1–4",
            "Editorial + Fact Check: ~$0.20",
            "Revision: ~$0.50–2",
            "KDP + Ingestion + Cover: ~$0.50"
          ]}
          cta="See live estimate"
          href="/estimate"
        />
        <Tier
          name="Done-for-you"
          price="Custom"
          tagline="If you'd rather not run it yourself."
          features={[
            "Hosted instance",
            "Bring your KDP catalog",
            "Series migration",
            "Cover design templates",
            "Author-style fine-tuning",
            "Priority support"
          ]}
          cta="Contact"
          href="mailto:hello@example.com"
        />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-sm">
        <h2 className="font-semibold mb-2">Provider costs at a glance</h2>
        <p className="text-zinc-400 mb-3">
          Estimates based on current public pricing for the configured default models. The cost
          estimator page shows live numbers for any target length.
        </p>
        <ul className="space-y-1 font-mono text-xs text-zinc-300">
          <li>OpenAI gpt-4o — $0.0025 in / $0.010 out per 1K</li>
          <li>Anthropic claude-sonnet-4-6 — $0.003 in / $0.015 out per 1K</li>
          <li>Google gemini-2.0-flash — $0.0001 in / $0.0004 out per 1K</li>
          <li>OpenAI text-embedding-3-small — $0.00002 / 1K (embeddings only)</li>
          <li>OpenAI gpt-image-1 — ~$0.04 / image (cover generation)</li>
        </ul>
      </div>
    </main>
  );
}

function Tier({
  name,
  price,
  tagline,
  features,
  cta,
  href,
  highlight
}: {
  name: string;
  price: string;
  tagline: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <div className={
      "rounded-2xl border p-6 flex flex-col " +
      (highlight ? "border-white bg-zinc-900" : "border-zinc-800 bg-zinc-950")
    }>
      <div className="text-xs uppercase tracking-wider text-zinc-500">{name}</div>
      <div className="text-3xl font-bold mt-1">{price}</div>
      <div className="text-sm text-zinc-400 mt-1">{tagline}</div>
      <ul className="mt-4 space-y-1.5 text-sm flex-1">
        {features.map((f) => <li key={f} className="text-zinc-200">· {f}</li>)}
      </ul>
      <Link
        href={href}
        className={
          "mt-5 rounded-xl px-4 py-2 text-sm font-medium text-center " +
          (highlight ? "bg-white text-black" : "border border-zinc-700 hover:bg-zinc-900")
        }
      >
        {cta}
      </Link>
    </div>
  );
}
