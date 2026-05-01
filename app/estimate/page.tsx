"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface StepEstimate {
  step: string;
  agent: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  usd: number;
  notes: string;
}
interface Estimate {
  totalUsd: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  steps: StepEstimate[];
}

export default function EstimatePage() {
  const [words, setWords] = useState(30000);
  const [chapters, setChapters] = useState<number | "">("");
  const [data, setData] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estimatedWords: words, estimatedChapters: chapters || undefined })
    });
    setData(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
        ← Books
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-2">Cost estimator</h1>
      <p className="text-sm text-zinc-400 mb-6">
        Estimated USD per book based on configured models. Updated live as you change inputs.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Field label="Estimated words">
          <input
            type="number"
            value={words}
            onChange={(e) => setWords(Number(e.target.value))}
            className="input"
            step={1000}
          />
        </Field>
        <Field label="Chapters (optional)">
          <input
            type="number"
            value={chapters}
            onChange={(e) => setChapters(e.target.value ? Number(e.target.value) : "")}
            className="input"
            placeholder="auto"
          />
        </Field>
        <div className="flex items-end">
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl bg-white text-black px-5 py-2 text-sm font-medium hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {loading ? "Estimating…" : "Recalculate"}
          </button>
        </div>
      </div>

      {data && (
        <>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 mb-6 text-center">
            <div className="text-xs uppercase tracking-wider text-zinc-500">Estimated total</div>
            <div className="text-4xl font-bold mt-2">${data.totalUsd.toFixed(2)}</div>
            <div className="text-xs text-zinc-500 mt-2 font-mono">
              {data.totalInputTokens.toLocaleString()} in · {data.totalOutputTokens.toLocaleString()} out
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="text-left py-2">Step</th>
                <th className="text-left py-2">Agent</th>
                <th className="text-left py-2">Model</th>
                <th className="text-right py-2">In tok</th>
                <th className="text-right py-2">Out tok</th>
                <th className="text-right py-2">USD</th>
              </tr>
            </thead>
            <tbody>
              {data.steps.map((s) => (
                <tr key={s.step} className="border-b border-zinc-900">
                  <td className="py-2">
                    <div className="font-medium capitalize">{s.step}</div>
                    <div className="text-xs text-zinc-500">{s.notes}</div>
                  </td>
                  <td className="py-2 text-zinc-400">{s.agent}</td>
                  <td className="py-2 font-mono text-zinc-400 text-xs">{s.model}</td>
                  <td className="py-2 text-right font-mono">{s.inputTokens.toLocaleString()}</td>
                  <td className="py-2 text-right font-mono">{s.outputTokens.toLocaleString()}</td>
                  <td className="py-2 text-right font-mono">${s.usd.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          background: #0b0b10;
          border: 1px solid #2a2a35;
          border-radius: 12px;
          padding: 0.6rem 0.8rem;
          color: #e7e7ea;
          font-size: 0.9rem;
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-zinc-400 mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
