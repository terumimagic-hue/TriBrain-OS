"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function BillingPage() {
  const [info, setInfo] = useState<{ active: { stripe_customer_id?: string | null; plan?: string; plan_label?: string } | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/license").then((r) => r.json()).then(setInfo);
  }, []);

  async function openPortal() {
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/portal", { method: "POST" });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
      if (body.url) window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Books</Link>
      <h1 className="text-2xl font-bold mt-2 mb-2">Billing</h1>
      <p className="text-sm text-zinc-400 mb-8">
        Manage subscriptions, payment methods, and invoices via Stripe's customer portal.
      </p>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        {info?.active ? (
          <>
            <div className="text-xs uppercase tracking-wider text-zinc-500">Current plan</div>
            <div className="text-xl font-semibold mt-1 mb-3">{info.active.plan_label}</div>
            <button
              onClick={openPortal}
              disabled={busy}
              className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {busy ? "Opening…" : "Open Stripe portal"}
            </button>
            {error && (
              <div className="mt-3 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-zinc-300">No active license. Buy one or activate a key.</p>
            <div className="mt-4 flex gap-2">
              <Link href="/pricing" className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium">Pricing</Link>
              <Link href="/license" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900">Activate key</Link>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 text-xs text-zinc-500">
        <Link href="/refund" className="hover:text-zinc-300 mr-3">Refund policy</Link>
        <Link href="/terms" className="hover:text-zinc-300 mr-3">Terms</Link>
        <Link href="/privacy" className="hover:text-zinc-300">Privacy</Link>
      </div>
    </main>
  );
}
