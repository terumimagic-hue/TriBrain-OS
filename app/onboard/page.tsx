"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type StepId = "welcome" | "keys" | "test" | "license" | "sample" | "done";

interface KeyTest {
  status: "idle" | "ok" | "error" | "loading";
  latency?: number;
  error?: string;
}

const STEPS: { id: StepId; label: string }[] = [
  { id: "welcome", label: "Welcome" },
  { id: "keys", label: "API keys" },
  { id: "test", label: "Connection test" },
  { id: "license", label: "License" },
  { id: "sample", label: "Sample" },
  { id: "done", label: "Done" }
];

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepId>("welcome");
  const [keys, setKeys] = useState({ openaiKey: "", anthropicKey: "", geminiKey: "" });
  const [tests, setTests] = useState<Record<string, KeyTest>>({
    openai: { status: "idle" },
    anthropic: { status: "idle" },
    gemini: { status: "idle" }
  });
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseStatus, setLicenseStatus] = useState<{ status: "idle" | "ok" | "error" | "loading"; plan?: string; error?: string }>({ status: "idle" });
  const [sampleProjectId, setSampleProjectId] = useState<string | null>(null);
  const [sampleStatus, setSampleStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  // Skip wizard if already onboarded
  useEffect(() => {
    fetch("/api/setup/state")
      .then((r) => r.json())
      .then((d) => {
        if (d.onboarded) router.replace("/");
      });
  }, [router]);

  async function saveKeys() {
    await fetch("/api/setup/save-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(keys)
    });
  }

  async function testProvider(provider: "openai" | "anthropic" | "gemini") {
    const apiKey = provider === "openai" ? keys.openaiKey : provider === "anthropic" ? keys.anthropicKey : keys.geminiKey;
    if (!apiKey) {
      setTests((t) => ({ ...t, [provider]: { status: "error", error: "no key" } }));
      return;
    }
    setTests((t) => ({ ...t, [provider]: { status: "loading" } }));
    const r = await fetch("/api/setup/test-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey })
    });
    const body = await r.json();
    if (body.ok) {
      setTests((t) => ({ ...t, [provider]: { status: "ok", latency: body.latencyMs } }));
    } else {
      setTests((t) => ({ ...t, [provider]: { status: "error", error: body.error } }));
    }
  }

  async function activateLicense() {
    setLicenseStatus({ status: "loading" });
    const r = await fetch("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: licenseKey })
    });
    const body = await r.json();
    if (r.ok) {
      setLicenseStatus({ status: "ok", plan: body.plan });
    } else {
      setLicenseStatus({ status: "error", error: body.error });
    }
  }

  async function createSample() {
    setSampleStatus("loading");
    const r = await fetch("/api/setup/sample", { method: "POST" });
    const body = await r.json();
    if (r.ok) {
      setSampleProjectId(body.project.id);
      setSampleStatus("ok");
    } else {
      setSampleStatus("error");
    }
  }

  async function finish() {
    await fetch("/api/setup/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markOnboarded: true, installId: cryptoRandom() })
    });
    router.push("/");
  }

  const stepIdx = STEPS.findIndex((s) => s.id === step);
  const allTestsPassed = Object.values(tests).every((t) => t.status === "ok");
  const anyKeyEntered = Object.values(keys).some((v) => v.trim().length > 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10">
        <div className="text-sm text-zinc-500">BookBrain OS · First-time setup</div>
        <h1 className="text-3xl font-bold mt-1">Let's get you publishing</h1>
      </div>

      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <span
              className={
                "px-3 py-1.5 rounded-full text-xs " +
                (i < stepIdx
                  ? "bg-emerald-900/40 text-emerald-300"
                  : i === stepIdx
                    ? "bg-white text-black"
                    : "bg-zinc-900 text-zinc-500")
              }
            >
              {i + 1}. {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 text-zinc-700">→</span>}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 min-h-[360px]">
        {step === "welcome" && (
          <>
            <h2 className="text-xl font-semibold mb-3">Welcome.</h2>
            <p className="text-zinc-300 mb-3">
              BookBrain OS turns one idea into a complete publishing package — manuscript,
              KDP listing, cover. Three providers do the heavy lifting:
            </p>
            <ul className="text-sm text-zinc-400 space-y-1 list-disc list-inside mb-6">
              <li><strong className="text-chatgpt">OpenAI</strong> — James (concept, editorial, KDP), embeddings, AI cover generation</li>
              <li><strong className="text-claude">Anthropic Claude</strong> — structure, drafting, revision</li>
              <li><strong className="text-gemini">Google Gemini</strong> — research, fact-check</li>
            </ul>
            <p className="text-zinc-300 mb-6">
              You'll need an API key for each. They live in your local SQLite, never sent anywhere.
            </p>
            <p className="text-zinc-400 text-sm">This wizard takes about 3 minutes.</p>
          </>
        )}

        {step === "keys" && (
          <>
            <h2 className="text-xl font-semibold mb-2">Paste your API keys</h2>
            <p className="text-zinc-400 text-sm mb-6">
              You can fill any subset and add the rest later in Settings. Keys are stored locally.
            </p>
            <div className="space-y-4">
              <KeyField
                label="OpenAI API key"
                value={keys.openaiKey}
                onChange={(v) => setKeys({ ...keys, openaiKey: v })}
                hint="https://platform.openai.com/api-keys"
              />
              <KeyField
                label="Anthropic API key"
                value={keys.anthropicKey}
                onChange={(v) => setKeys({ ...keys, anthropicKey: v })}
                hint="https://console.anthropic.com/settings/keys"
              />
              <KeyField
                label="Gemini API key"
                value={keys.geminiKey}
                onChange={(v) => setKeys({ ...keys, geminiKey: v })}
                hint="https://aistudio.google.com/app/apikey"
              />
            </div>
          </>
        )}

        {step === "test" && (
          <>
            <h2 className="text-xl font-semibold mb-2">Connection test</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Click each provider to send a tiny ping and confirm the key works.
            </p>
            <div className="space-y-3">
              {(["openai", "anthropic", "gemini"] as const).map((p) => {
                const t = tests[p];
                return (
                  <div key={p} className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusDot s={t.status} />
                      <span className="capitalize font-medium">{p}</span>
                      {t.status === "ok" && <span className="text-xs text-emerald-400">{t.latency}ms</span>}
                      {t.status === "error" && <span className="text-xs text-red-400">{t.error}</span>}
                    </div>
                    <button
                      onClick={() => testProvider(p)}
                      disabled={t.status === "loading"}
                      className="text-xs rounded-lg border border-zinc-700 px-3 py-1.5 hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {t.status === "loading" ? "Testing…" : t.status === "ok" ? "Re-test" : "Test"}
                    </button>
                  </div>
                );
              })}
            </div>
            {!allTestsPassed && (
              <p className="text-xs text-zinc-500 mt-4">
                You can skip failing providers and add them later. The pipeline only fails
                steps that need a missing key.
              </p>
            )}
          </>
        )}

        {step === "license" && (
          <>
            <h2 className="text-xl font-semibold mb-2">License</h2>
            <p className="text-zinc-400 text-sm mb-6">
              BookBrain OS runs on the Free plan by default (1 book/month). Paste a Starter,
              Pro, or Studio license to unlock more. You can buy one on the pricing page or
              skip this step for now.
            </p>
            <div className="space-y-3">
              <input
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                placeholder="BBOS-..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-mono"
              />
              <div className="flex gap-2">
                <button
                  onClick={activateLicense}
                  disabled={!licenseKey.trim() || licenseStatus.status === "loading"}
                  className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium disabled:bg-zinc-800 disabled:text-zinc-500"
                >
                  {licenseStatus.status === "loading" ? "Activating…" : "Activate"}
                </button>
                <Link
                  href="/pricing"
                  target="_blank"
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
                >
                  Get a license
                </Link>
              </div>
              {licenseStatus.status === "ok" && (
                <div className="rounded-lg bg-emerald-950/40 border border-emerald-900 px-3 py-2 text-sm text-emerald-200">
                  ✓ {licenseStatus.plan?.toUpperCase()} plan activated.
                </div>
              )}
              {licenseStatus.status === "error" && (
                <div className="rounded-lg bg-red-950/40 border border-red-900 px-3 py-2 text-sm text-red-300">
                  ⚠ {licenseStatus.error}
                </div>
              )}
            </div>
          </>
        )}

        {step === "sample" && (
          <>
            <h2 className="text-xl font-semibold mb-2">Sample project (optional)</h2>
            <p className="text-zinc-400 text-sm mb-6">
              Create a small sample project so you can run the pipeline once before starting
              real work.
            </p>
            <button
              onClick={createSample}
              disabled={sampleStatus === "loading"}
              className="rounded-xl bg-white text-black px-5 py-2 text-sm font-medium disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              {sampleStatus === "loading" ? "Creating…" : "Create sample project"}
            </button>
            {sampleStatus === "ok" && (
              <div className="mt-4 rounded-lg bg-emerald-950/40 border border-emerald-900 px-3 py-2 text-sm text-emerald-200">
                ✓ Sample created.{" "}
                <Link href={`/projects/${sampleProjectId}`} className="underline">
                  Open it →
                </Link>
              </div>
            )}
            {sampleStatus === "error" && (
              <div className="mt-4 rounded-lg bg-amber-950/40 border border-amber-900 px-3 py-2 text-sm text-amber-200">
                Project quota exceeded — you can finish onboarding and upgrade later.
              </div>
            )}
          </>
        )}

        {step === "done" && (
          <>
            <h2 className="text-xl font-semibold mb-3">You're set up.</h2>
            <p className="text-zinc-300 mb-6">
              Open the dashboard, create a book, and run the full pipeline when you're ready.
            </p>
            <ul className="text-sm text-zinc-300 space-y-2 mb-6">
              <li>✓ API keys saved</li>
              <li>✓ Connection tested</li>
              <li>{licenseStatus.status === "ok" ? "✓ License activated" : "· Free plan active"}</li>
              <li>{sampleStatus === "ok" ? "✓ Sample project created" : "· No sample created"}</li>
            </ul>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        {stepIdx > 0 ? (
          <button
            onClick={() => setStep(STEPS[stepIdx - 1].id)}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
          >
            ← Back
          </button>
        ) : <span />}
        <div className="flex gap-2">
          {step !== "done" && step !== "welcome" && (
            <button
              onClick={() => setStep(STEPS[stepIdx + 1].id)}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900"
            >
              Skip →
            </button>
          )}
          {step === "welcome" && (
            <button
              onClick={() => setStep("keys")}
              className="rounded-xl bg-white text-black px-5 py-2 text-sm font-medium"
            >
              Begin →
            </button>
          )}
          {step === "keys" && (
            <button
              onClick={async () => { await saveKeys(); setStep("test"); }}
              disabled={!anyKeyEntered}
              className="rounded-xl bg-white text-black px-5 py-2 text-sm font-medium disabled:bg-zinc-800 disabled:text-zinc-500"
            >
              Save keys →
            </button>
          )}
          {step === "test" && (
            <button
              onClick={() => setStep("license")}
              className="rounded-xl bg-white text-black px-5 py-2 text-sm font-medium"
            >
              Continue →
            </button>
          )}
          {step === "license" && (
            <button
              onClick={() => setStep("sample")}
              className="rounded-xl bg-white text-black px-5 py-2 text-sm font-medium"
            >
              Continue →
            </button>
          )}
          {step === "sample" && (
            <button
              onClick={() => setStep("done")}
              className="rounded-xl bg-white text-black px-5 py-2 text-sm font-medium"
            >
              Continue →
            </button>
          )}
          {step === "done" && (
            <button
              onClick={finish}
              className="rounded-xl bg-white text-black px-5 py-2 text-sm font-medium"
            >
              Open dashboard
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function KeyField({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-zinc-400 block mb-1.5">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm font-mono"
        placeholder="sk-..."
      />
      <a href={hint} target="_blank" rel="noreferrer" className="text-[11px] text-zinc-500 hover:text-zinc-300 mt-1 inline-block">
        Get a key →
      </a>
    </label>
  );
}

function StatusDot({ s }: { s: KeyTest["status"] }) {
  const c =
    s === "ok" ? "bg-emerald-400"
    : s === "error" ? "bg-red-500"
    : s === "loading" ? "bg-amber-400 animate-pulse"
    : "bg-zinc-600";
  return <span className={`h-2.5 w-2.5 rounded-full ${c}`} />;
}

function cryptoRandom(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}
