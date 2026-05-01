import Link from "next/link";

export const metadata = { title: "Privacy — BookBrain OS" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Back</Link>
      <h1 className="text-3xl font-bold mt-2 mb-2">Privacy</h1>
      <p className="text-xs text-zinc-500 mb-8">Last updated: ____</p>

      <Section title="Where your data lives">
        Self-hosted installs store all data — projects, manuscripts, knowledge,
        cover assets, license, and settings — locally in SQLite and on the local
        filesystem. We do not receive a copy.
      </Section>

      <Section title="Provider calls">
        Pipeline runs send prompts and book content to OpenAI, Anthropic, and Google
        using your API keys. Each provider has its own privacy and data-retention
        policy; please review them.
      </Section>

      <Section title="Stripe">
        If you purchase via Stripe, Stripe receives the personal and payment
        information you provide. We receive a customer email and Stripe IDs to map
        a license to your purchase.
      </Section>

      <Section title="Hosted SaaS (if used)">
        Hosted plans store the same project data on our infrastructure. We do not
        train models on your content. Backups are encrypted at rest. You may export
        and delete your data at any time.
      </Section>

      <Section title="Logs">
        BookBrain OS keeps a per-call cost log (tokens in/out, USD estimate) for
        usage and quota enforcement. No prompt content is included in cost logs.
      </Section>

      <Section title="Contact">
        Privacy questions: <em>____</em>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-semibold mb-2">{title}</h2>
      <p className="text-sm text-zinc-300 leading-relaxed">{children}</p>
    </section>
  );
}
