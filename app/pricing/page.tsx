"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface PriceItem {
  priceId: string;
  plan: "starter" | "pro" | "studio";
  lifetime: boolean;
  label: string;
}

interface Catalog {
  stripeConfigured: boolean;
  prices: PriceItem[];
}

export default function PricingPage() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/checkout/catalog").then((r) => r.json()).then(setCatalog).catch(() => {});
  }, []);

  async function checkout(priceId: string) {
    setBusy(priceId);
    setError(null);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId })
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
      if (body.url) window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(null);
    }
  }

  function priceFor(plan: PriceItem["plan"], lifetime: boolean) {
    return catalog?.prices.find((p) => p.plan === plan && p.lifetime === lifetime) ?? null;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link href="/welcome" className="text-xs text-zinc-500 hover:text-zinc-300">← Back</Link>
      <h1 className="text-4xl font-bold mt-3 mb-2">Pricing</h1>
      <p className="text-zinc-400 mb-10 max-w-2xl">
        BookBrain OS runs locally with your own provider keys. Buy the OS once (lifetime)
        or as a hosted subscription. Per-book provider spend is separate.
      </p>

      {!catalog?.stripeConfigured && (
        <div className="rounded-xl border border-amber-700/60 bg-amber-950/20 px-4 py-3 mb-8 text-sm text-amber-200">
          Stripe is not configured on this install. Set <code>STRIPE_SECRET_KEY</code> and the
          relevant <code>STRIPE_PRICE_*</code> environment variables. You can still activate
          a manual license at <Link href="/license" className="underline">/license</Link>.
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-900 bg-red-950/40 px-4 py-2 mb-6 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 mb-12">
        <Tier
          name="Starter"
          price={{ lifetime: "¥49,800", monthly: "¥9,800/mo" }}
          tagline="One-author publishing."
          features={[
            "5 books per month",
            "AI cover generation",
            "Paperback wraparound PDF",
            "Knowledge base",
            "All exports (.md, .docx, ZIP)"
          ]}
          lifetime={priceFor("starter", true)}
          monthly={priceFor("starter", false)}
          onCheckout={checkout}
          busy={busy}
        />
        <Tier
          highlight
          name="Pro"
          price={{ lifetime: "¥98,000", monthly: "¥29,800/mo" }}
          tagline="Series authors and ghostwriters."
          features={[
            "20 books per month",
            "AI cover generation",
            "Paperback PDF + barcode reserve",
            "Knowledge + style DNA",
            "Priority email support"
          ]}
          lifetime={priceFor("pro", true)}
          monthly={priceFor("pro", false)}
          onCheckout={checkout}
          busy={busy}
        />
        <Tier
          name="Studio"
          price={{ lifetime: "Contact", monthly: "Contact" }}
          tagline="Imprints and high-volume publishers."
          features={[
            "Unlimited books",
            "All Pro features",
            "Multi-author workflows (roadmap)",
            "Custom integrations",
            "Done-for-you setup"
          ]}
          lifetime={priceFor("studio", true)}
          monthly={priceFor("studio", false)}
          onCheckout={checkout}
          busy={busy}
        />
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-sm">
        <h2 className="font-semibold mb-2">Provider costs (separate)</h2>
        <p className="text-zinc-400 mb-3">
          You pay model providers directly with your own keys. The estimator shows a live
          breakdown for any target length.
        </p>
        <ul className="space-y-1 font-mono text-xs text-zinc-300">
          <li>OpenAI gpt-4o — $0.0025 / $0.010 per 1K (in / out)</li>
          <li>Anthropic claude-sonnet-4-6 — $0.003 / $0.015 per 1K</li>
          <li>Google gemini-2.0-flash — $0.0001 / $0.0004 per 1K</li>
          <li>OpenAI text-embedding-3-small — $0.00002 / 1K</li>
          <li>OpenAI gpt-image-1 — ~$0.04 / image</li>
        </ul>
        <Link href="/estimate" className="inline-block mt-3 underline text-zinc-300 text-xs">
          Run the cost estimator →
        </Link>
      </div>

      <div className="text-center mt-12 text-xs text-zinc-500">
        <Link href="/refund" className="hover:text-zinc-300 mr-4">Refund policy</Link>
        <Link href="/terms" className="hover:text-zinc-300 mr-4">Terms</Link>
        <Link href="/privacy" className="hover:text-zinc-300">Privacy</Link>
      </div>
    </main>
  );
}

function Tier({
  name,
  price,
  tagline,
  features,
  lifetime,
  monthly,
  onCheckout,
  busy,
  highlight
}: {
  name: string;
  price: { lifetime: string; monthly: string };
  tagline: string;
  features: string[];
  lifetime: PriceItem | null;
  monthly: PriceItem | null;
  onCheckout: (priceId: string) => void;
  busy: string | null;
  highlight?: boolean;
}) {
  return (
    <div className={
      "rounded-2xl border p-6 flex flex-col " +
      (highlight ? "border-white bg-zinc-900" : "border-zinc-800 bg-zinc-950")
    }>
      <div className="text-xs uppercase tracking-wider text-zinc-500">{name}</div>
      <div className="mt-1">
        <div className="text-2xl font-bold">{price.lifetime}</div>
        <div className="text-xs text-zinc-400">lifetime · or {price.monthly}</div>
      </div>
      <div className="text-sm text-zinc-400 mt-2">{tagline}</div>
      <ul className="mt-4 space-y-1.5 text-sm flex-1">
        {features.map((f) => <li key={f} className="text-zinc-200">· {f}</li>)}
      </ul>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          disabled={!lifetime || busy === lifetime?.priceId}
          onClick={() => lifetime && onCheckout(lifetime.priceId)}
          className={
            "rounded-xl px-3 py-2 text-xs font-medium " +
            (highlight ? "bg-white text-black" : "border border-zinc-700") +
            (!lifetime ? " opacity-40 cursor-not-allowed" : "")
          }
        >
          {busy === lifetime?.priceId ? "…" : "Buy lifetime"}
        </button>
        <button
          disabled={!monthly || busy === monthly?.priceId}
          onClick={() => monthly && onCheckout(monthly.priceId)}
          className={
            "rounded-xl px-3 py-2 text-xs " +
            "border border-zinc-700 hover:bg-zinc-900" +
            (!monthly ? " opacity-40 cursor-not-allowed" : "")
          }
        >
          {busy === monthly?.priceId ? "…" : "Subscribe"}
        </button>
      </div>
    </div>
  );
}
