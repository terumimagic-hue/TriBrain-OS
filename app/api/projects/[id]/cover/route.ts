import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { CoverAssets, CoverDesigns, Exports, Projects } from "@/lib/db/models";
import { computePaperback, ebookPreset, type PaperbackInput } from "@/lib/cover/dimensions";
import { coverOutDir, renderEbook, renderPaperback } from "@/lib/cover/render";
import type { EbookCoverConfig, PaperbackCoverConfig } from "@/lib/cover/elements";

export const runtime = "nodejs";
export const maxDuration = 300;

interface Body {
  kind: "ebook" | "paperback";
  paperback?: PaperbackInput;
  ebookConfig?: EbookCoverConfig;
  paperbackConfig?: PaperbackCoverConfig;
  assetId?: string | null;
  // If true, also save the design + register output files in export_file table
  persist?: boolean;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const project = Projects.get(params.id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Body;

  const dir = await coverOutDir(project.id);
  const persist = body.persist ?? true;

  const asset = body.assetId ? CoverAssets.get(body.assetId) : null;
  if (body.assetId && !asset) {
    return NextResponse.json({ error: "asset not found" }, { status: 404 });
  }
  if (asset && asset.project_id !== project.id) {
    return NextResponse.json({ error: "asset belongs to a different project" }, { status: 403 });
  }

  if (body.kind === "ebook") {
    const config: EbookCoverConfig = body.ebookConfig ?? {
      background: { color: "#101018" },
      elements: defaultEbookElements(project)
    };
    const dim = ebookPreset();
    const { png, jpg } = await renderEbook(config, asset?.path ?? null);
    const pngPath = path.join(dir, "ebook_cover.png");
    const jpgPath = path.join(dir, "ebook_cover.jpg");
    const metaPath = path.join(dir, "ebook_cover_metadata.json");
    await fs.writeFile(pngPath, png);
    await fs.writeFile(jpgPath, jpg);
    await fs.writeFile(metaPath, JSON.stringify({ ...dim, asset_id: asset?.id ?? null, config }, null, 2), "utf-8");

    if (persist) {
      Exports.add(project.id, "cover_png", pngPath, png.byteLength);
      Exports.add(project.id, "cover_jpg", jpgPath, jpg.byteLength);
      Exports.add(project.id, "cover_metadata", metaPath, Buffer.byteLength(JSON.stringify({ dim, config })));
      CoverDesigns.upsert(project.id, "ebook", config, asset?.id ?? null);
    }
    return NextResponse.json({
      kind: "ebook",
      dimensions: dim,
      files: [pngPath, jpgPath, metaPath],
      previewUrl: `/api/projects/${project.id}/cover/file?path=${encodeURIComponent(pngPath)}`
    });
  }

  if (body.kind !== "paperback") {
    return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  }
  if (!body.paperback) {
    return NextResponse.json({ error: "paperback config required" }, { status: 400 });
  }
  const dim = computePaperback(body.paperback);

  const config: PaperbackCoverConfig = body.paperbackConfig ?? {
    background: { color: "#101018" },
    elements: defaultPaperbackElements(project),
    showGuides: false
  };

  const { pngPreview, pngFlat, pdf } = await renderPaperback(dim, config, asset?.path ?? null);
  const previewPath = path.join(dir, "paperback_cover_preview.png");
  const flatPath = path.join(dir, "paperback_cover.png");
  const pdfPath = path.join(dir, "paperback_cover.pdf");
  const metaPath = path.join(dir, "paperback_cover_metadata.json");

  await fs.writeFile(previewPath, pngPreview);
  await fs.writeFile(flatPath, pngFlat);
  await fs.writeFile(pdfPath, pdf);
  await fs.writeFile(metaPath, JSON.stringify({ ...dim, asset_id: asset?.id ?? null, config }, null, 2), "utf-8");

  if (persist) {
    Exports.add(project.id, "cover_pdf", pdfPath, pdf.byteLength);
    Exports.add(project.id, "cover_png", flatPath, pngFlat.byteLength);
    Exports.add(project.id, "cover_metadata", metaPath, Buffer.byteLength(JSON.stringify({ dim, config })));
    CoverDesigns.upsert(project.id, "paperback", { ...config, paperback: body.paperback }, asset?.id ?? null);
  }
  return NextResponse.json({
    kind: "paperback",
    dimensions: dim,
    files: [pdfPath, flatPath, previewPath, metaPath],
    previewUrl: `/api/projects/${project.id}/cover/file?path=${encodeURIComponent(previewPath)}`
  });
}

function defaultEbookElements(project: { working_title: string; title: string | null }) {
  const title = project.title || project.working_title;
  return [
    { type: "title" as const, text: title, y: 0.18 },
    { type: "subtitle" as const, text: "", y: 0.32 },
    { type: "author" as const, text: "James", y: 0.92 }
  ];
}

function defaultPaperbackElements(project: { working_title: string; title: string | null }) {
  const title = project.title || project.working_title;
  return [
    { type: "title" as const, text: title, y: 0.18 },
    { type: "subtitle" as const, text: "", y: 0.32 },
    { type: "author" as const, text: "James", y: 0.92 },
    { type: "spine_text" as const, text: title, fontSize: 36, rotateDeg: -90 },
    { type: "back_text" as const, text: "", y: 0.18 }
  ];
}
