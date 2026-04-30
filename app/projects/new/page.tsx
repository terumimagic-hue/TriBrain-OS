"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    workingTitle: "",
    idea: "",
    language: "en",
    market: "US",
    tone: "",
    estimatedWords: 35000,
    referenceBooks: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          estimatedWords: Number(form.estimatedWords),
          referenceBooks: form.referenceBooks
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        })
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `HTTP ${res.status}`);
      }
      const project = await res.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold mb-6">New book project</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Working title" required>
          <input
            value={form.workingTitle}
            onChange={(e) => setForm({ ...form, workingTitle: e.target.value })}
            className="input"
            placeholder="e.g., Tribrain — How three minds beat one"
            required
          />
        </Field>
        <Field label="Book idea" required>
          <textarea
            value={form.idea}
            onChange={(e) => setForm({ ...form, idea: e.target.value })}
            rows={5}
            className="input resize-y"
            placeholder="Plain-language description of the book. The audience, the promise, the unique angle."
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Language">
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="input"
            >
              <option value="en">English</option>
              <option value="ja">Japanese</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </Field>
          <Field label="Target market">
            <select
              value={form.market}
              onChange={(e) => setForm({ ...form, market: e.target.value })}
              className="input"
            >
              <option value="US">US (Amazon.com)</option>
              <option value="JP">JP (Amazon.co.jp)</option>
              <option value="UK">UK (Amazon.co.uk)</option>
              <option value="DE">DE (Amazon.de)</option>
              <option value="FR">FR (Amazon.fr)</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tone">
            <input
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value })}
              className="input"
              placeholder="e.g., direct, conversational, no-fluff"
            />
          </Field>
          <Field label="Target length (words)">
            <input
              type="number"
              value={form.estimatedWords}
              onChange={(e) => setForm({ ...form, estimatedWords: Number(e.target.value) })}
              className="input"
            />
          </Field>
        </div>
        <Field label="Reference books (one per line, optional)">
          <textarea
            value={form.referenceBooks}
            onChange={(e) => setForm({ ...form, referenceBooks: e.target.value })}
            rows={3}
            className="input resize-y"
            placeholder={"Atomic Habits\nThe Lean Startup"}
          />
        </Field>

        {error && (
          <div className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !form.workingTitle || !form.idea}
            className="rounded-xl bg-white text-black px-5 py-2 text-sm font-medium disabled:bg-zinc-800 disabled:text-zinc-500"
          >
            {submitting ? "Creating…" : "Create project"}
          </button>
        </div>
      </form>

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
        .input:focus {
          outline: none;
          border-color: #555;
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
