import Link from "next/link";

export const metadata = { title: "Terms — BookBrain OS" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Back</Link>
      <h1 className="text-3xl font-bold mt-2 mb-2">Terms of Service</h1>
      <p className="text-xs text-zinc-500 mb-8">Last updated: ____</p>

      <Section title="1. Acceptance">
        By installing, activating a license for, or using BookBrain OS ("the Software"),
        you agree to these terms. If you do not agree, do not use the Software.
      </Section>

      <Section title="2. License">
        BookBrain OS is licensed, not sold. Subject to payment, you receive either a
        time-limited subscription or a perpetual lifetime license to install and use
        the Software in accordance with the plan you purchased.
      </Section>

      <Section title="3. Plan limits">
        Plans include a monthly project quota and feature flags. Exceeding the quota
        prevents additional projects until renewal or upgrade.
      </Section>

      <Section title="4. Provider services">
        The Software calls third-party providers (OpenAI, Anthropic, Google) using
        your API keys. You are responsible for compliance with each provider's terms
        and for all usage costs incurred under your keys.
      </Section>

      <Section title="5. Generated content">
        You retain ownership of content you produce with the Software, subject to the
        terms of the underlying providers. We make no warranties about the accuracy,
        suitability, or commercial viability of generated content.
      </Section>

      <Section title="6. No warranty">
        The Software is provided "as is" without warranty of any kind. To the maximum
        extent permitted by law, we disclaim all implied warranties.
      </Section>

      <Section title="7. Limitation of liability">
        Our aggregate liability is limited to the amount you paid for the Software in
        the 12 months preceding the claim.
      </Section>

      <Section title="8. Termination">
        Subscriptions terminate at the end of the current billing cycle. Lifetime
        licenses may be revoked only for material breach of these terms.
      </Section>

      <Section title="9. Contact">
        Questions about these terms: <em>____</em>
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
