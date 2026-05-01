import Link from "next/link";

export const metadata = { title: "Refund Policy — BookBrain OS" };

export default function RefundPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Back</Link>
      <h1 className="text-3xl font-bold mt-2 mb-2">Refund Policy</h1>
      <p className="text-xs text-zinc-500 mb-8">Last updated: ____</p>

      <Section title="Beta program">
        BookBrain OS is currently sold as a beta product to a limited number
        of customers. As a digital product, all sales are final and{" "}
        <strong>non-refundable</strong>.
      </Section>

      <Section title="Critical malfunction exception">
        If the Software cannot be installed or run on a supported platform
        because of a defect on our side, contact us. We will work with you
        to resolve the issue, and if we cannot, we will issue a full
        refund and revoke the license. This exception covers genuine
        software failures only — not provider API errors, network issues,
        or differences in expected output quality.
      </Section>

      <Section title="Provider charges">
        Provider API charges (OpenAI, Anthropic, Google) are billed by the
        provider directly using your keys and are not refundable through us.
      </Section>

      <Section title="How to request">
        Email the address in your purchase receipt. Include your license
        key and a clear description of the issue. We aim to respond within
        3 business days.
      </Section>

      <Section title="Subscriptions (if applicable)">
        Subscription plans can be canceled at any time from the Stripe
        customer portal at <Link href="/billing" className="underline">/billing</Link>.
        Cancellation takes effect at the end of the current billing
        period; we do not pro-rate partial months.
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
