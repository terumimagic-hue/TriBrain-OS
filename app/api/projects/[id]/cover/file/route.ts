import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Projects } from "@/lib/db/models";
import { exportDir } from "@/lib/db/client";

export const runtime = "nodejs";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".json": "application/json"
};

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const project = Projects.get(params.id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const url = new URL(req.url);
  const filePath = url.searchParams.get("path");
  if (!filePath) return NextResponse.json({ error: "path required" }, { status: 400 });

  const baseDir = path.resolve(await exportDir(), project.id);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(baseDir + path.sep) && resolved !== baseDir) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const buf = await fs.readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const arrayBuffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "no-cache"
      }
    });
  } catch {
    return NextResponse.json({ error: "could not read file" }, { status: 500 });
  }
}
