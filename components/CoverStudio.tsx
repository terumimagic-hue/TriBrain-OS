"use client";

import { useEffect, useState } from "react";
import { TRIM_PRESETS, type CoverDimensions, type EbookDimensions, type PaperType } from "@/lib/cover/dimensions";

interface Props {
  projectId: string;
}

const PAPER_LABEL: Record<PaperType, string> = {
  bw_white: "B&W · white paper",
  bw_cream: "B&W · cream paper",
  color_standard: "Color · standard",
  color_premium: "Color · premium"
};

export default function CoverStudio({ projectId }: Props) {
  const [tab, setTab] = useState<"ebook" | "paperback">("ebook");
  const [paperback, setPaperback] = useState({
    trimWidth: 6,
    trimHeight: 9,
    pageCount: 220,
    paperType: "bw_white" as PaperType,
    bleed: true,
    barcodeReserve: false
  });
  const [pbDim, setPbDim] = useState<CoverDimensions | null>(null);
  const [ebDim, setEbDim] = useState<EbookDimensions | null>(null);
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cover/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "ebook" })
    })
      .then((r) => r.json())
      .then(setEbDim)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== "paperback") return;
    fetch("/api/cover/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "paperback", paperback })
    })
      .then((r) => r.json())
      .then((d) => (d?.error ? setError(d.error) : (setPbDim(d), setError(null))))
      .catch(() => {});
  }, [paperback, tab]);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          tab === "ebook"
            ? { kind: "ebook" }
            : { kind: "paperback", paperback }
        )
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setGenerated(body.files);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="text-sm font-semibold tracking-wider uppercase text-zinc-300 mb-3">
        Cover Studio
      </h2>

      <div className="flex gap-2 mb-4">
        <TabButton active={tab === "ebook"} onClick={() => setTab("ebook")}>
          Ebook (1600 × 2560)
        </TabButton>
        <TabButton active={tab === "paperback"} onClick={() => setTab("paperback")}>
          Paperback (wraparound)
        </TabButton>
      </div>

      {tab === "ebook" && ebDim && (
        <div className="text-sm text-zinc-300 space-y-2">
          <Row label="Pixels">{ebDim.pixelWidth} × {ebDim.pixelHeight} px</Row>
          <Row label="Aspect">{ebDim.ratio}</Row>
          <Row label="Format">JPG / PNG</Row>
        </div>
      )}

      {tab === "paperback" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Trim width (in)"
              value={paperback.trimWidth}
              onChange={(v) => setPaperback({ ...paperback, trimWidth: v })}
              step={0.1}
            />
            <NumberField
              label="Trim height (in)"
              value={paperback.trimHeight}
              onChange={(v) => setPaperback({ ...paperback, trimHeight: v })}
              step={0.1}
            />
            <NumberField
              label="Page count"
              value={paperback.pageCount}
              onChange={(v) => setPaperback({ ...paperback, pageCount: Math.round(v) })}
              step={1}
            />
            <Field label="Paper type">
              <select
                value={paperback.paperType}
                onChange={(e) => setPaperback({ ...paperback, paperType: e.target.value as PaperType })}
                className="input"
              >
                {(Object.keys(PAPER_LABEL) as PaperType[]).map((p) => (
                  <option key={p} value={p}>
                    {PAPER_LABEL[p]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-zinc-500 self-center mr-2">Presets:</span>
            {TRIM_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => setPaperback({ ...paperback, trimWidth: p.w, trimHeight: p.h })}
                className="text-xs rounded-full border border-zinc-700 px-3 py-1 hover:bg-zinc-900"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={paperback.bleed}
                onChange={(e) => setPaperback({ ...paperback, bleed: e.target.checked })}
              />
              Bleed (0.125 in)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={paperback.barcodeReserve}
                onChange={(e) => setPaperback({ ...paperback, barcodeReserve: e.target.checked })}
              />
              Reserve barcode area
            </label>
          </div>

          {pbDim && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm space-y-1.5 font-mono">
              <Row label="Spine">{pbDim.spineWidth.toFixed(3)} in</Row>
              <Row label="Total cover (in)">
                {pbDim.totalWidth.toFixed(3)} × {pbDim.totalHeight.toFixed(3)}
              </Row>
              <Row label="At 300 DPI (px)">
                {pbDim.px.totalWidth} × {pbDim.px.totalHeight}
              </Row>
              <Row label="Safe margin">{pbDim.safeMargin} in</Row>
              {pbDim.spineSafeMargin > 0 && (
                <Row label="Spine text-safe inset">{pbDim.spineSafeMargin} in</Row>
              )}
              {pbDim.barcodeBox && (
                <Row label="Barcode reserve">
                  {pbDim.barcodeBox.width} × {pbDim.barcodeBox.height} in (back cover, lower right)
                </Row>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          Generates a print-ready template PDF + metadata JSON.
        </span>
        <button
          onClick={generate}
          disabled={busy}
          className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {busy ? "Generating…" : "Generate cover template"}
        </button>
      </div>

      {generated && (
        <div className="mt-3 rounded-lg bg-emerald-950/30 border border-emerald-900/60 px-3 py-2 text-xs text-emerald-200">
          Saved to:
          <ul className="mt-1 list-disc list-inside">
            {generated.map((f) => (
              <li key={f} className="font-mono break-all">{f}</li>
            ))}
          </ul>
        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          background: #0b0b10;
          border: 1px solid #2a2a35;
          border-radius: 10px;
          padding: 0.45rem 0.6rem;
          color: #e7e7ea;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full px-3 py-1.5 text-sm border " +
        (active
          ? "bg-white text-black border-white"
          : "text-zinc-300 border-zinc-700 hover:border-zinc-500")
      }
    >
      {children}
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input"
      />
    </Field>
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
