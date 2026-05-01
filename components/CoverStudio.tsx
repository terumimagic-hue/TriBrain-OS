"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TRIM_PRESETS,
  type CoverDimensions,
  type EbookDimensions,
  type PaperType
} from "@/lib/cover/dimensions";
import type {
  CoverElement,
  ElementType,
  EbookCoverConfig,
  PaperbackCoverConfig,
  BackgroundConfig
} from "@/lib/cover/elements";

interface Props {
  projectId: string;
  workingTitle: string;
  finalTitle?: string | null;
  authorDefault?: string;
  coverPromptDefault?: string;
}

const PAPER_LABEL: Record<PaperType, string> = {
  bw_white: "B&W · white paper",
  bw_cream: "B&W · cream paper",
  color_standard: "Color · standard",
  color_premium: "Color · premium"
};

interface AssetRow {
  id: string;
  origin: "upload" | "ai";
  filename: string;
  width: number | null;
  height: number | null;
  prompt: string | null;
  created_at: string;
}

export default function CoverStudio({
  projectId,
  workingTitle,
  finalTitle,
  authorDefault,
  coverPromptDefault
}: Props) {
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

  const initialTitle = finalTitle || workingTitle;
  const [bg, setBg] = useState<BackgroundConfig>({
    color: "#101018",
    imageMode: "front_only",
    overlayColor: "#000000",
    overlayOpacity: 0.25,
    vignette: true
  });
  const [elements, setElements] = useState<Record<ElementType, CoverElement>>({
    title: { type: "title", text: initialTitle, y: 0.18, fontSize: 160, color: "#ffffff", weight: "bold", align: "center" },
    subtitle: { type: "subtitle", text: "", y: 0.34, fontSize: 70, color: "#e7e7ea", align: "center" },
    author: { type: "author", text: authorDefault || "James", y: 0.92, fontSize: 64, color: "#ffffff", align: "center" },
    spine_text: { type: "spine_text", text: initialTitle, fontSize: 36, rotateDeg: -90, color: "#ffffff" },
    back_text: { type: "back_text", text: "", y: 0.18, fontSize: 40, color: "#dddddd", align: "left" }
  });

  const [assets, setAssets] = useState<AssetRow[]>([]);
  const [assetId, setAssetId] = useState<string | null>(null);

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generated, setGenerated] = useState<string[] | null>(null);

  // Fetch ebook preset once
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

  // Recompute paperback dimensions on input change
  useEffect(() => {
    if (tab !== "paperback") return;
    fetch("/api/cover/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "paperback", paperback })
    })
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) setError(d.error);
        else { setPbDim(d); setError(null); }
      })
      .catch(() => {});
  }, [paperback, tab]);

  // Load assets
  async function loadAssets() {
    const r = await fetch(`/api/projects/${projectId}/cover/assets`);
    if (r.ok) setAssets(await r.json());
  }
  useEffect(() => { loadAssets(); }, [projectId]);

  function patchElement(type: ElementType, patch: Partial<CoverElement>) {
    setElements((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }));
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("uploading");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`/api/projects/${projectId}/cover/upload`, { method: "POST", body: fd });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
      setAssetId(body.id);
      await loadAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
      e.target.value = "";
    }
  }

  async function aiGenerate() {
    setBusy("generating");
    setError(null);
    try {
      const r = await fetch(`/api/projects/${projectId}/cover/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: coverPromptDefault })
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || `HTTP ${r.status}`);
      setAssetId(body.asset.id);
      await loadAssets();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function renderCover(opts: { showGuides?: boolean; persist?: boolean } = {}) {
    setBusy("rendering");
    setError(null);
    try {
      let body: Record<string, unknown>;
      if (tab === "ebook") {
        const cfg: EbookCoverConfig = {
          background: bg,
          elements: [elements.title, elements.subtitle, elements.author]
        };
        body = { kind: "ebook", ebookConfig: cfg, assetId, persist: opts.persist ?? true };
      } else {
        const cfg: PaperbackCoverConfig = {
          background: bg,
          elements: [
            elements.title,
            elements.subtitle,
            elements.author,
            elements.spine_text,
            elements.back_text
          ],
          showGuides: opts.showGuides ?? false
        };
        body = {
          kind: "paperback",
          paperback,
          paperbackConfig: cfg,
          assetId,
          persist: opts.persist ?? true
        };
      }
      const r = await fetch(`/api/projects/${projectId}/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setPreviewUrl(`${data.previewUrl}&_=${Date.now()}`);
      setGenerated(data.files);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  const previewAspect = useMemo(() => {
    if (tab === "ebook") return 1600 / 2560;
    if (pbDim) return pbDim.totalWidth / pbDim.totalHeight;
    return 6 / 9;
  }, [tab, pbDim]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <TabButton active={tab === "ebook"} onClick={() => setTab("ebook")}>
          Ebook (1600 × 2560)
        </TabButton>
        <TabButton active={tab === "paperback"} onClick={() => setTab("paperback")}>
          Paperback (wraparound)
        </TabButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Preview */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
            <div
              className="w-full bg-zinc-900 rounded-lg overflow-hidden"
              style={{ aspectRatio: `${previewAspect}` }}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="cover preview" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full grid place-items-center text-zinc-500 text-sm">
                  Click "Render preview" to see the cover
                </div>
              )}
            </div>
          </div>

          {/* Dimension stats */}
          {tab === "ebook" && ebDim && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm grid grid-cols-3 gap-3 font-mono">
              <Stat label="Pixels">{ebDim.pixelWidth} × {ebDim.pixelHeight}</Stat>
              <Stat label="Aspect">{ebDim.ratio}</Stat>
              <Stat label="Output">PNG + JPG</Stat>
            </div>
          )}
          {tab === "paperback" && pbDim && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm grid grid-cols-2 gap-3 font-mono">
              <Stat label="Spine">{pbDim.spineWidth.toFixed(3)} in</Stat>
              <Stat label="Total (in)">
                {pbDim.totalWidth.toFixed(3)} × {pbDim.totalHeight.toFixed(3)}
              </Stat>
              <Stat label="At 300 DPI">{pbDim.px.totalWidth} × {pbDim.px.totalHeight}</Stat>
              <Stat label="Safe / bleed">{pbDim.safeMargin} / {pbDim.bleedInches} in</Stat>
              {pbDim.barcodeBox && (
                <Stat label="Barcode reserve">{pbDim.barcodeBox.width}×{pbDim.barcodeBox.height} in</Stat>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Image source */}
          <Card title="Cover image">
            <div className="space-y-3">
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer text-center rounded-lg border border-zinc-700 px-3 py-2 text-xs hover:bg-zinc-900">
                  Upload image
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadFile} className="hidden" />
                </label>
                <button
                  onClick={aiGenerate}
                  disabled={busy !== null}
                  className="flex-1 rounded-lg border border-zinc-700 px-3 py-2 text-xs hover:bg-zinc-900 disabled:opacity-50"
                >
                  {busy === "generating" ? "Generating…" : "AI generate (gpt-image)"}
                </button>
              </div>
              {assets.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-auto scrollbar-thin">
                  {assets.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAssetId(a.id)}
                      className={
                        "w-full text-left rounded-md border px-2 py-1.5 text-xs " +
                        (assetId === a.id
                          ? "border-white bg-zinc-900"
                          : "border-zinc-800 hover:border-zinc-600")
                      }
                    >
                      <div className="font-mono">{a.origin.toUpperCase()} · {a.filename}</div>
                      <div className="text-zinc-500">{a.width || "?"} × {a.height || "?"}</div>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => setAssetId(null)}
                disabled={!assetId}
                className="text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-40"
              >
                Use solid background only (clear image)
              </button>
              {tab === "paperback" && (
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={bg.imageMode === "wraparound"}
                    onChange={(e) =>
                      setBg({ ...bg, imageMode: e.target.checked ? "wraparound" : "front_only" })
                    }
                  />
                  Stretch image across full wraparound
                </label>
              )}
            </div>
          </Card>

          {/* Background */}
          <Card title="Background">
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Base color" value={bg.color || "#101018"} onChange={(v) => setBg({ ...bg, color: v })} />
              <ColorField label="Overlay" value={bg.overlayColor || "#000000"} onChange={(v) => setBg({ ...bg, overlayColor: v })} />
              <NumberField
                label="Overlay opacity"
                value={bg.overlayOpacity ?? 0}
                step={0.05}
                onChange={(v) => setBg({ ...bg, overlayOpacity: v })}
              />
              <label className="flex items-center gap-2 text-xs mt-5">
                <input
                  type="checkbox"
                  checked={!!bg.vignette}
                  onChange={(e) => setBg({ ...bg, vignette: e.target.checked })}
                />
                Vignette
              </label>
            </div>
          </Card>

          {/* Text elements */}
          <Card title="Title">
            <ElementEditor element={elements.title} onChange={(p) => patchElement("title", p)} />
          </Card>
          <Card title="Subtitle">
            <ElementEditor element={elements.subtitle} onChange={(p) => patchElement("subtitle", p)} />
          </Card>
          <Card title="Author">
            <ElementEditor element={elements.author} onChange={(p) => patchElement("author", p)} />
          </Card>

          {tab === "paperback" && (
            <>
              <Card title="Spine text">
                <ElementEditor element={elements.spine_text} onChange={(p) => patchElement("spine_text", p)} hidePosition />
              </Card>
              <Card title="Back cover text">
                <ElementEditor element={elements.back_text} onChange={(p) => patchElement("back_text", p)} multiline />
              </Card>

              {/* Paperback dimensions */}
              <Card title="Paperback specs">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <NumberField label="Trim width (in)" value={paperback.trimWidth} step={0.1} onChange={(v) => setPaperback({ ...paperback, trimWidth: v })} />
                  <NumberField label="Trim height (in)" value={paperback.trimHeight} step={0.1} onChange={(v) => setPaperback({ ...paperback, trimHeight: v })} />
                  <NumberField label="Pages" value={paperback.pageCount} step={1} onChange={(v) => setPaperback({ ...paperback, pageCount: Math.round(v) })} />
                  <Field label="Paper type">
                    <select
                      value={paperback.paperType}
                      onChange={(e) => setPaperback({ ...paperback, paperType: e.target.value as PaperType })}
                      className="input"
                    >
                      {(Object.keys(PAPER_LABEL) as PaperType[]).map((p) => (
                        <option key={p} value={p}>{PAPER_LABEL[p]}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
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
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={paperback.bleed} onChange={(e) => setPaperback({ ...paperback, bleed: e.target.checked })} />
                    Bleed
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={paperback.barcodeReserve} onChange={(e) => setPaperback({ ...paperback, barcodeReserve: e.target.checked })} />
                    Reserve barcode
                  </label>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      <div className="flex flex-wrap gap-2 justify-end">
        {tab === "paperback" && (
          <button
            onClick={() => renderCover({ showGuides: true, persist: false })}
            disabled={busy !== null}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900 disabled:opacity-50"
          >
            Preview with guides
          </button>
        )}
        <button
          onClick={() => renderCover({ persist: false })}
          disabled={busy !== null}
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-900 disabled:opacity-50"
        >
          {busy === "rendering" ? "Rendering…" : "Render preview"}
        </button>
        <button
          onClick={() => renderCover({ persist: true })}
          disabled={busy !== null}
          className="rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {tab === "ebook" ? "Save PNG + JPG" : "Save PDF + PNG"}
        </button>
      </div>

      {generated && (
        <div className="rounded-lg bg-emerald-950/30 border border-emerald-900/60 px-3 py-2 text-xs text-emerald-200">
          Saved:
          <ul className="mt-1 list-disc list-inside">
            {generated.map((f) => <li key={f} className="font-mono break-all">{f}</li>)}
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
        .input:focus { outline: none; border-color: #555; }
      `}</style>
    </div>
  );
}

function ElementEditor({
  element,
  onChange,
  hidePosition,
  multiline
}: {
  element: CoverElement;
  onChange: (patch: Partial<CoverElement>) => void;
  hidePosition?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2">
      {multiline ? (
        <textarea
          value={element.text}
          onChange={(e) => onChange({ text: e.target.value })}
          rows={4}
          className="input resize-y"
          placeholder="Text…"
        />
      ) : (
        <input
          value={element.text}
          onChange={(e) => onChange({ text: e.target.value })}
          className="input"
          placeholder="Text…"
        />
      )}
      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Font size" value={element.fontSize ?? 64} step={2} onChange={(v) => onChange({ fontSize: v })} />
        <ColorField label="Color" value={element.color ?? "#ffffff"} onChange={(v) => onChange({ color: v })} />
        {!hidePosition && (
          <NumberField label="Y position" value={element.y ?? 0.5} step={0.01} min={0} max={1} onChange={(v) => onChange({ y: v })} />
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">{label}</div>
      <div className="text-zinc-200">{children}</div>
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
        (active ? "bg-white text-black border-white" : "text-zinc-300 border-zinc-700 hover:border-zinc-500")
      }
    >
      {children}
    </button>
  );
}

function NumberField({
  label,
  value,
  step,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input"
      />
    </Field>
  );
}

function ColorField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-zinc-800 bg-zinc-950 cursor-pointer"
      />
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">{label}</span>
      {children}
    </label>
  );
}
