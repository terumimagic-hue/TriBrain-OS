"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Diagnostics {
  versions: { node: string };
  providers: {
    openai: { hasKey: boolean; model: string; embeddingModel: string };
    anthropic: { hasKey: boolean; model: string };
    gemini: { hasKey: boolean; model: string };
  };
  license: { plan: string; status: string; source: string; expires_at: string | null } | null;
  plan: { id: string; label: string };
  quota: { used: number; limit: number; remaining: number | null; exceeded: boolean };
  cost: { monthlyUsed: number; monthlyLimit: number; remaining: number | null; exceeded: boolean };
  storage: { db_path: string; db_bytes: number; exports_bytes: number };
  counts: Record<string, number>;
  stuck_runs: { id: string; step: string; status: string; started_at: string }[];
  stripe: { configured: boolean };
}

export default function DiagnosticsPage() {
  const [d, setD] = useState<Diagnostics | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [recovered, setRecovered] = useState<number | null>(null);

  async function load() {
    const r = await fetch("/api/diagnostics");
    setD(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function recoverStuck() {
    setRecovering(true);
    const r = await fetch("/api/diagnostics/recover-stuck", { method: "POST" });
    const body = await r.json();
    setRecovered(body.recovered);
    setRecovering(false);
    await load();
  }

  if (!d) return <main className="p-10 text-zinc-500">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Books</Link>
      <h1 className="text-2xl font-bold mt-2 mb-2">Diagnostics</h1>
      <p className="text-sm text-zinc-400 mb-6">
        One-click overview of provider connectivity, license, quota, costs, storage, and
        stuck runs.
      </p>

      <Card title="Providers">
        <Row label="OpenAI">{badge(d.providers.openai.hasKey)} <span className="font-mono text-xs text-zinc-400">{d.providers.openai.model}</span></Row>
        <Row label="Anthropic">{badge(d.providers.anthropic.hasKey)} <span className="font-mono text-xs text-zinc-400">{d.providers.anthropic.model}</span></Row>
        <Row label="Gemini">{badge(d.providers.gemini.hasKey)} <span className="font-mono text-xs text-zinc-400">{d.providers.gemini.model}</span></Row>
        <Row label="Embeddings"><span className="font-mono text-xs text-zinc-400">{d.providers.openai.embeddingModel}</span></Row>
      </Card>

      <Card title="License">
        {d.license ? (
          <>
            <Row label="Plan">{d.plan.label}</Row>
            <Row label="Status">{d.license.status}</Row>
            <Row label="Source">{d.license.source}</Row>
            {d.license.expires_at && <Row label="Expires">{new Date(d.license.expires_at).toLocaleDateString()}</Row>}
          </>
        ) : (
          <Row label="Active license">—</Row>
        )}
        <Row label="Stripe">{d.stripe.configured ? "configured" : "not configured"}</Row>
      </Card>

      <Card title="Usage">
        <Row label="Books this month">{d.quota.used}/{d.quota.limit === 0 ? "∞" : d.quota.limit}</Row>
        <Row label="Monthly cost">${d.cost.monthlyUsed.toFixed(3)} / ${d.cost.monthlyLimit > 0 ? d.cost.monthlyLimit.toFixed(2) : "∞"}</Row>
      </Card>

      <Card title="Storage">
        <Row label="DB path"><span className="font-mono text-xs">{d.storage.db_path}</span></Row>
        <Row label="DB size">{(d.storage.db_bytes / 1024).toFixed(1)} KB</Row>
        <Row label="Exports">{(d.storage.exports_bytes / 1024 / 1024).toFixed(2)} MB</Row>
      </Card>

      <Card title="Counts">
        {Object.entries(d.counts).map(([k, v]) => (
          <Row key={k} label={k}>{v}</Row>
        ))}
      </Card>

      <Card title={`Stuck runs (${d.stuck_runs.length})`}>
        {d.stuck_runs.length === 0 ? (
          <div className="text-sm text-zinc-500">No stuck runs.</div>
        ) : (
          <>
            <ul className="text-xs space-y-1 mb-3">
              {d.stuck_runs.map((r) => (
                <li key={r.id} className="font-mono">{r.step} · started {r.started_at}</li>
              ))}
            </ul>
            <button
              onClick={recoverStuck}
              disabled={recovering}
              className="rounded-xl border border-amber-700 text-amber-200 px-4 py-2 text-sm hover:bg-amber-950/30"
            >
              {recovering ? "Recovering…" : "Mark stuck runs as failed"}
            </button>
            {recovered !== null && (
              <div className="text-xs text-emerald-400 mt-2">Recovered {recovered} run(s).</div>
            )}
          </>
        )}
      </Card>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 mb-3">
      <h2 className="text-xs uppercase tracking-wider text-zinc-400 mb-3">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200">{children}</span>
    </div>
  );
}

function badge(ok: boolean) {
  return (
    <span className={"text-xs px-2 py-0.5 rounded-full " + (ok ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300")}>
      {ok ? "key set" : "missing"}
    </span>
  );
}
