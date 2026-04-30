import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Exports, Projects } from "@/lib/db/models";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pdf": "application/pdf"
};

export async function GET(
  _req: Request,
  { params }: { params: { id: string; file: string } }
): Promise<Response> {
  const project = Projects.get(params.id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const exports = Exports.byProject(project.id);
  const target = exports.find((e) => path.basename(e.path) === params.file);
  if (!target) return NextResponse.json({ error: "file not found" }, { status: 404 });
  try {
    const buf = await fs.readFile(target.path);
    const ext = path.extname(target.path).toLowerCase();
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${path.basename(target.path)}"`
      }
    });
  } catch {
    return NextResponse.json({ error: "could not read file" }, { status: 500 });
  }
}
