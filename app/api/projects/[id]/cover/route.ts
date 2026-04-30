import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Projects, Exports } from "@/lib/db/models";
import { exportDir } from "@/lib/db/client";
import { computePaperback, ebookPreset, type PaperbackInput } from "@/lib/cover/dimensions";
import { renderEbookTemplatePDF, renderPaperbackTemplatePDF } from "@/lib/cover/pdf";

export const runtime = "nodejs";

interface Body {
  kind: "ebook" | "paperback";
  paperback?: PaperbackInput;
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const project = Projects.get(params.id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body?.kind) return NextResponse.json({ error: "kind required" }, { status: 400 });

  const dir = path.join(await exportDir(), project.id, "cover");
  await fs.mkdir(dir, { recursive: true });

  if (body.kind === "ebook") {
    const dim = ebookPreset();
    const pdf = await renderEbookTemplatePDF(`${project.title || project.working_title} — ebook cover template`);
    const pdfPath = path.join(dir, "ebook_cover_template.pdf");
    await fs.writeFile(pdfPath, pdf);
    const metaPath = path.join(dir, "ebook_cover_metadata.json");
    await fs.writeFile(metaPath, JSON.stringify(dim, null, 2), "utf-8");
    Exports.add(project.id, "cover_pdf", pdfPath, pdf.byteLength);
    Exports.add(project.id, "cover_metadata", metaPath, Buffer.byteLength(JSON.stringify(dim)));
    return NextResponse.json({ kind: "ebook", dimensions: dim, files: [pdfPath, metaPath] });
  }

  if (!body.paperback) return NextResponse.json({ error: "paperback config required" }, { status: 400 });
  let dim;
  try {
    dim = computePaperback(body.paperback);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
  const pdf = await renderPaperbackTemplatePDF(dim, `${project.title || project.working_title} — paperback wraparound template`);
  const pdfPath = path.join(dir, `paperback_cover_${dim.trimWidth}x${dim.trimHeight}_${dim.pageCount}p.pdf`);
  await fs.writeFile(pdfPath, pdf);
  const metaPath = path.join(dir, `paperback_cover_metadata.json`);
  await fs.writeFile(metaPath, JSON.stringify(dim, null, 2), "utf-8");
  Exports.add(project.id, "cover_pdf", pdfPath, pdf.byteLength);
  Exports.add(project.id, "cover_metadata", metaPath, Buffer.byteLength(JSON.stringify(dim)));

  return NextResponse.json({ kind: "paperback", dimensions: dim, files: [pdfPath, metaPath] });
}
