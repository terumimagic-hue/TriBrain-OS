"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SeriesRow {
  id: string;
  name: string;
  description: string | null;
  tone: string | null;
  rules: unknown;
}

export default function SeriesPage() {
  const [items, setItems] = useState<SeriesRow[]>([]);
  const [editing, setEditing] = useState<SeriesRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", tone: "", rules: "" });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/series");
    setItems(await r.json());
  }

  useEffect(() => { load(); }, []);

  function startEdit(s: SeriesRow) {
    setCreating(false);
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description || "",
      tone: s.tone || "",
      rules: s.rules ? JSON.stringify(s.rules, null, 2) : ""
    });
  }

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setForm({ name: "", description: "", tone: "", rules: "" });
  }

  async function save() {
    setError(null);
    let rules: unknown = null;
    if (form.rules.trim()) {
      try {
        rules = JSON.parse(form.rules);
      } catch (e) {
        setError("Rules must be valid JSON");
        return;
      }
    }
    const body = { name: form.name, description: form.description, tone: form.tone, rules };
    const url = editing ? `/api/series/${editing.id}` : "/api/series";
    const method = editing ? "PATCH" : "POST";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) {
      const b = await r.json().catch(() => ({}));
      setError(b.error || `HTTP ${r.status}`);
      return;
    }
    setEditing(null);
    setCreating(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this series?")) return;
    await fetch(`/api/series/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
        ← Books
      </Link>
      <div className="flex items-start justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Series profiles</h1>
          <p className="text-sm text-zinc-400 mt-1">
            A series carries continuity rules, tone, and shared style across multiple books.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium"
        >
          New series
        </button>
      </div>

      <div className="grid gap-3 mb-8">
        {items.length === 0 && (
          <div className="rounded-xl border border-zinc-800 p-6 text-zinc-400 text-sm">
            No series yet.
          </div>
        )}
        {items.map((s) => (
          <div key={s.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{s.name}</div>
                {s.tone && <div className="text-xs text-zinc-500 mt-0.5">tone: {s.tone}</div>}
                {s.description && <div className="text-sm text-zinc-300 mt-1">{s.description}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(s)} className="text-xs rounded-lg border border-zinc-700 px-3 py-1 hover:bg-zinc-900">Edit</button>
                <button onClick={() => remove(s.id)} className="text-xs rounded-lg border border-red-900 text-red-400 px-3 py-1 hover:bg-red-950/40">Delete</button>
              </div>
            </div>
            {!!s.rules && (
              <pre className="mt-3 text-xs text-zinc-400 font-mono whitespace-pre-wrap">
                {JSON.stringify(s.rules, null, 2) ?? ""}
              </pre>
            )}
          </div>
        ))}
      </div>

      {(editing || creating) && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-sm font-semibold mb-4">
            {editing ? `Edit: ${editing.name}` : "New series"}
          </h2>
          <div className="space-y-3">
            <Field label="Name" required>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input resize-y" />
            </Field>
            <Field label="Tone">
              <input value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })} className="input" />
            </Field>
            <Field label="Rules (JSON)">
              <textarea
                value={form.rules}
                onChange={(e) => setForm({ ...form, rules: e.target.value })}
                rows={6}
                className="input resize-y font-mono"
                placeholder={'{ "second_person": true, "no_meta_commentary": true }'}
              />
            </Field>
            {error && <div className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">{error}</div>}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => { setEditing(null); setCreating(false); }} className="rounded-lg border border-zinc-700 px-4 py-1.5 text-sm hover:bg-zinc-900">
                Cancel
              </button>
              <button onClick={save} disabled={!form.name} className="rounded-lg bg-white text-black px-4 py-1.5 text-sm font-medium disabled:bg-zinc-800 disabled:text-zinc-500">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          background: #0b0b10;
          border: 1px solid #2a2a35;
          border-radius: 12px;
          padding: 0.55rem 0.7rem;
          color: #e7e7ea;
          font-size: 0.9rem;
        }
      `}</style>
    </main>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-zinc-400 mb-1.5 block">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
