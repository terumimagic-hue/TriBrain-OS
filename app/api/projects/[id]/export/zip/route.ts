import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import archiver from "archiver";
import { PassThrough } from "node:stream";
import { Projects, Exports } from "@/lib/db/models";
import { exportDir } from "@/lib/db/client";
import { ensureFeature } from "@/lib/license/guards";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const project = Projects.get(params.id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const feature = ensureFeature("zipExport");
  if (!feature.ok) return NextResponse.json({ error: feature.error, hint: feature.hint }, { status: feature.status });

  const projectDir = path.join(await exportDir(), project.id);
  const exportsList = Exports.byProject(project.id);

  const archive = archiver("zip", { zlib: { level: 9 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  // Append the entire project export directory if it exists
  if (existsSync(projectDir)) {
    archive.directory(projectDir, "files");
  }

  const summary = {
    project,
    exports: exportsList.map((e) => ({ kind: e.kind, file: path.basename(e.path), bytes: e.bytes }))
  };
  archive.append(JSON.stringify(summary, null, 2), { name: "project_summary.json" });

  archive.finalize().catch(() => {});

  const chunks: Buffer[] = [];
  for await (const chunk of passthrough as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  const zip = Buffer.concat(chunks);

  // Persist a copy
  const zipPath = path.join(projectDir, `${project.id}_full_export.zip`);
  await fs.mkdir(projectDir, { recursive: true });
  await fs.writeFile(zipPath, zip);
  Exports.add(project.id, "full_zip", zipPath, zip.byteLength);

  const ab = zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer;
  return new NextResponse(ab, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${project.id}_full_export.zip"`
    }
  });
}
