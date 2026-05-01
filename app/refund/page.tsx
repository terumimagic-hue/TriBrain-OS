import Link from "next/link";

export const metadata = { title: "Refund Policy — BookBrain OS" };

export default function RefundPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Back</Link>
      <h1 className="text-3xl font-bold mt-2 mb-2">Refund Policy</h1>
      <p className="text-xs text-zinc-500 mb-8">Last updated: ____</p>

      <Section title="Subscriptions">
        Cancel any time from the Stripe portal. Cancellation takes effect at the end
        of the current billing period. We do not pro-rate partial months.
      </Section>

      <Section title="Lifetime licenses">
        Lifetime licenses are eligible for a refund within 14 days of purchase if you
        have not generated more than 3 books with the activated license. After that,
        all sales are final.
      </Section>

      <Section title="How to request a refund">
        Email <em>____</em> from the address used at checkout. Include the Stripe
        receipt or license key. We aim to respond within 3 business days.
      </Section>

      <Section title="Provider charges">
        Provider API charges (OpenAI, Anthropic, Google) are billed by the provider
        directly using your keys and are not refundable through us.
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
