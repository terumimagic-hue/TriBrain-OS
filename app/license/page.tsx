"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface LicenseInfo {
  active: {
    plan: string;
    plan_label: string;
    status: string;
    source: string;
    customer_email: string | null;
    activated_at: string | null;
    expires_at: string | null;
    monthly_project_limit: number;
    features: Record<string, boolean>;
  } | null;
  plan: { id: string; label: string };
  reason?: string;
  quota: { used: number; limit: number; exceeded: boolean };
}

export default function LicensePage() {
  const [info, setInfo] = useState<LicenseInfo | null>(null);
  const [key, setKey] = useState("");
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/license");
    setInfo(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function activate() {
    setActivating(true); setError(null);
    try {
      const r = await fetch("/api/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
      setKey("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setActivating(false); }
  }

  async function deactivate() {
    if (!confirm("Deactivate the current license? You can reactivate any time with the same key.")) return;
    await fetch("/api/license", { method: "DELETE" });
    await load();
  }

  if (!info) return <main className="p-10 text-zinc-500">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Books</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">License</h1>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">Active plan</div>
            <div className="text-2xl font-bold mt-1">{info.plan.label}</div>
            {info.reason && <div className="text-xs text-zinc-500 mt-1">{info.reason}</div>}
          </div>
          {info.active && (
            <button onClick={deactivate} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs hover:bg-zinc-900">
              Deactivate
            </button>
          )}
        </div>
        {info.active && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Row label="Status">{info.active.status}</Row>
            <Row label="Source">{info.active.source}</Row>
            {info.active.customer_email && <Row label="Customer">{info.active.customer_email}</Row>}
            {info.active.activated_at && <Row label="Activated">{new Date(info.active.activated_at).toLocaleString()}</Row>}
            {info.active.expires_at && <Row label="Expires">{new Date(info.active.expires_at).toLocaleDateString()}</Row>}
            <Row label="Monthly limit">{info.active.monthly_project_limit === 0 ? "unlimited" : info.active.monthly_project_limit}</Row>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 mb-6">
        <h2 className="text-sm font-semibold mb-2">Activate a license</h2>
        <p className="text-xs text-zinc-500 mb-3">
          Paste a key starting with <code className="font-mono">BBOS-</code>. Keys are
          verified locally with HMAC; no network call needed.
        </p>
        <div className="flex gap-2">
          <input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="BBOS-..."
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-mono"
          />
          <button
            onClick={activate}
            disabled={!key.trim() || activating}
            className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {activating ? "Activating…" : "Activate"}
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">{error}</div>
        )}
        <div className="mt-4 flex gap-2 text-xs">
          <Link href="/pricing" className="rounded-lg border border-zinc-700 px-3 py-1.5 hover:bg-zinc-900">
            Buy a license →
          </Link>
          <Link href="/billing" className="rounded-lg border border-zinc-700 px-3 py-1.5 hover:bg-zinc-900">
            Billing
          </Link>
        </div>
      </div>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200">{children}</span>
    </div>
  );
}
