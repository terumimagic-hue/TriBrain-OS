"use client";

import { useState } from "react";
import PromptInput from "@/components/PromptInput";
import ModeSelector from "@/components/ModeSelector";
import AnswerPanel from "@/components/AnswerPanel";
import SynthesisPanel from "@/components/SynthesisPanel";
import DebatePanel from "@/components/DebatePanel";
import HistoryList from "@/components/HistoryList";
import type { CouncilSession, ModeId, ProviderId } from "@/lib/types";

const PROVIDERS: ProviderId[] = ["openai", "anthropic", "gemini"];

export default function HomePage() {
  const [mode, setMode] = useState<ModeId>("general");
  const [debate, setDebate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<CouncilSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  async function runCouncil(prompt: string) {
    setLoading(true);
    setError(null);
    setSession({
      id: "pending",
      prompt,
      mode,
      createdAt: new Date().toISOString(),
      results: []
    });
    try {
      const res = await fetch("/api/council", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode, debate, synthesize: true })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as CouncilSession;
      setSession(data);
      setHistoryKey((k) => k + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadSession(id: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/history/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as CouncilSession;
      setSession(data);
      setMode(data.mode);
      setDebate(Boolean(data.debateRounds?.length));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const resultsByProvider = (() => {
    const map = new Map<ProviderId, CouncilSession["results"][number]>();
    const lastRound =
      session?.debateRounds?.[session.debateRounds.length - 1]?.results ??
      session?.results ??
      [];
    for (const r of lastRound) map.set(r.provider, r);
    return map;
  })();

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          TriBrain <span className="text-zinc-500">OS</span>
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          One question, three minds. ChatGPT, Claude, and Gemini answer in
          parallel — then a final judge merges the best of all three.
        </p>
      </header>

      <section className="mb-6 space-y-4">
        <ModeSelector value={mode} onChange={setMode} disabled={loading} />
        <PromptInput
          onSubmit={runCouncil}
          loading={loading}
          debate={debate}
          onToggleDebate={setDebate}
        />
        {error && (
          <div className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {PROVIDERS.map((p) => (
              <AnswerPanel
                key={p}
                provider={p}
                result={resultsByProvider.get(p)}
                loading={loading}
              />
            ))}
          </div>

          <SynthesisPanel
            content={session?.synthesis}
            provider={session?.synthesisProvider}
            loading={loading}
          />

          {session?.debateRounds && session.debateRounds.length > 0 && (
            <DebatePanel rounds={session.debateRounds} />
          )}
        </div>

        <aside>
          <HistoryList refreshKey={historyKey} onSelect={loadSession} />
        </aside>
      </div>

      <footer className="mt-12 text-center text-xs text-zinc-600">
        Local-first. API keys live only in your <code>.env</code>. History
        stored in <code>data/sessions.json</code>.
      </footer>
    </main>
  );
}
