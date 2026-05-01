"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SettingsRow {
  default_author: string | null;
  default_language: string;
  default_market: string;
  default_tone: string | null;
  default_trim_w: number;
  default_trim_h: number;
  default_paper_type: string;
  cost_limit_monthly_usd: number;
  openai_model: string | null;
  anthropic_model: string | null;
  gemini_model: string | null;
  embedding_model: string | null;
  openai_key_override: string | null;
  anthropic_key_override: string | null;
  gemini_key_override: string | null;
  synthesis_provider: string | null;
  demo_mode: number;
  has_openai_override: boolean;
  has_anthropic_override: boolean;
  has_gemini_override: boolean;
}

export default function SettingsPage() {
  const [s, setS] = useState<SettingsRow | null>(null);
  const [keys, setKeys] = useState({ openaiKey: "", anthropicKey: "", geminiKey: "" });
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function load() {
    const r = await fetch("/api/settings");
    setS(await r.json());
  }

  useEffect(() => { load(); }, []);

  async function save(patch: Partial<SettingsRow>) {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    setSavedAt(Date.now());
    await load();
  }

  async function saveKeys() {
    const patch: Record<string, string | null> = {};
    if (keys.openaiKey) patch.openai_key_override = keys.openaiKey;
    if (keys.anthropicKey) patch.anthropic_key_override = keys.anthropicKey;
    if (keys.geminiKey) patch.gemini_key_override = keys.geminiKey;
    if (Object.keys(patch).length) {
      await save(patch as never);
      setKeys({ openaiKey: "", anthropicKey: "", geminiKey: "" });
    }
  }

  async function clearKey(provider: "openai" | "anthropic" | "gemini") {
    const field = `${provider}_key_override`;
    await save({ [field]: null } as never);
  }

  if (!s) return <main className="p-10 text-zinc-500">Loading…</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← Books</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Settings</h1>

      {savedAt && (
        <div className="rounded-lg border border-emerald-900 bg-emerald-950/30 px-3 py-2 mb-6 text-xs text-emerald-200">
          Saved at {new Date(savedAt).toLocaleTimeString()}.
        </div>
      )}

      <Section title="API keys">
        <p className="text-xs text-zinc-500 mb-4">
          Stored in SQLite. Override <code>.env</code> values without a restart.
        </p>
        <div className="space-y-3">
          <KeyRow
            label="OpenAI"
            value={s.has_openai_override ? s.openai_key_override : null}
            input={keys.openaiKey}
            setInput={(v) => setKeys({ ...keys, openaiKey: v })}
            onClear={() => clearKey("openai")}
          />
          <KeyRow
            label="Anthropic"
            value={s.has_anthropic_override ? s.anthropic_key_override : null}
            input={keys.anthropicKey}
            setInput={(v) => setKeys({ ...keys, anthropicKey: v })}
            onClear={() => clearKey("anthropic")}
          />
          <KeyRow
            label="Gemini"
            value={s.has_gemini_override ? s.gemini_key_override : null}
            input={keys.geminiKey}
            setInput={(v) => setKeys({ ...keys, geminiKey: v })}
            onClear={() => clearKey("gemini")}
          />
          <button
            onClick={saveKeys}
            disabled={!keys.openaiKey && !keys.anthropicKey && !keys.geminiKey}
            className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            Save keys
          </button>
        </div>
      </Section>

      <Section title="Models">
        <div className="grid grid-cols-2 gap-3">
          <Field label="OpenAI model">
            <input value={s.openai_model || ""} placeholder="gpt-4o" onChange={(e) => save({ openai_model: e.target.value })} className="input" />
          </Field>
          <Field label="Anthropic model">
            <input value={s.anthropic_model || ""} placeholder="claude-sonnet-4-6" onChange={(e) => save({ anthropic_model: e.target.value })} className="input" />
          </Field>
          <Field label="Gemini model">
            <input value={s.gemini_model || ""} placeholder="gemini-2.0-flash" onChange={(e) => save({ gemini_model: e.target.value })} className="input" />
          </Field>
          <Field label="Embedding model">
            <input value={s.embedding_model || ""} placeholder="text-embedding-3-small" onChange={(e) => save({ embedding_model: e.target.value })} className="input" />
          </Field>
          <Field label="Synthesis judge (TriBrain)">
            <select value={s.synthesis_provider || ""} onChange={(e) => save({ synthesis_provider: e.target.value })} className="input">
              <option value="">(default)</option>
              <option value="anthropic">anthropic</option>
              <option value="openai">openai</option>
              <option value="gemini">gemini</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Cost limit">
        <Field label="Monthly USD limit (0 = no limit)">
          <input
            type="number"
            step={1}
            value={s.cost_limit_monthly_usd}
            onChange={(e) => save({ cost_limit_monthly_usd: Number(e.target.value) })}
            className="input"
          />
        </Field>
        <p className="text-xs text-zinc-500 mt-2">
          Once the current month's logged provider spend hits this number, agent runs and AI
          cover generation are blocked until next month or until you raise the limit.
        </p>
      </Section>

      <Section title="Defaults for new books">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Author"><input value={s.default_author || ""} onChange={(e) => save({ default_author: e.target.value })} className="input" /></Field>
          <Field label="Tone"><input value={s.default_tone || ""} onChange={(e) => save({ default_tone: e.target.value })} className="input" /></Field>
          <Field label="Language">
            <select value={s.default_language} onChange={(e) => save({ default_language: e.target.value })} className="input">
              {["en","ja","es","fr","de","zh"].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Market">
            <select value={s.default_market} onChange={(e) => save({ default_market: e.target.value })} className="input">
              {["US","JP","UK","DE","FR"].map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Default trim width (in)">
            <input type="number" step={0.1} value={s.default_trim_w} onChange={(e) => save({ default_trim_w: Number(e.target.value) })} className="input" />
          </Field>
          <Field label="Default trim height (in)">
            <input type="number" step={0.1} value={s.default_trim_h} onChange={(e) => save({ default_trim_h: Number(e.target.value) })} className="input" />
          </Field>
          <Field label="Default paper">
            <select value={s.default_paper_type} onChange={(e) => save({ default_paper_type: e.target.value })} className="input">
              <option value="bw_white">B&W white</option>
              <option value="bw_cream">B&W cream</option>
              <option value="color_standard">Color standard</option>
              <option value="color_premium">Color premium</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Demo mode">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!s.demo_mode}
            onChange={(e) => save({ demo_mode: e.target.checked ? 1 : 0 })}
          />
          Enable demo mode
        </label>
        <p className="text-xs text-zinc-500 mt-1">
          When on, the dashboard surfaces the bundled sample project and skips destructive
          operations like project delete from the UI.
        </p>
      </Section>

      <Section title="Backup & diagnostics">
        <div className="flex flex-wrap gap-2">
          <a href="/api/backup" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900">
            Download backup
          </a>
          <Link href="/diagnostics" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900">
            Open diagnostics
          </Link>
          <Link href="/license" className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900">
            License
          </Link>
        </div>
      </Section>

      <style jsx>{`
        .input {
          width: 100%;
          background: #0b0b10;
          border: 1px solid #2a2a35;
          border-radius: 10px;
          padding: 0.5rem 0.7rem;
          color: #e7e7ea;
          font-size: 0.85rem;
        }
      `}</style>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">{title}</h2>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-zinc-500 block mb-1">{label}</span>
      {children}
    </label>
  );
}

function KeyRow({
  label,
  value,
  input,
  setInput,
  onClear
}: {
  label: string;
  value: string | null;
  input: string;
  setInput: (v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-zinc-500 font-mono">
          {value ? value : "(using .env)"}
        </span>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste new key to override .env"
          className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-mono"
        />
        {value && (
          <button onClick={onClear} className="text-xs rounded-lg border border-zinc-700 px-3 py-2 hover:bg-zinc-900">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
