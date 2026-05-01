import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { CoverAssets, Projects } from "@/lib/db/models";
import { uploadsDir } from "@/lib/cover/render";
import { newId } from "@/lib/db/client";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const project = Projects.get(params.id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "multipart form required" }, { status: 400 });

  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const ext = path.extname(file.name).toLowerCase() || ".png";
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    return NextResponse.json({ error: "unsupported file type" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(buf).metadata().catch(() => ({} as sharp.Metadata));

  const dir = await uploadsDir(project.id);
  const filename = `cover_${newId("up")}${ext}`;
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, buf);

  const asset = CoverAssets.add(
    project.id,
    "upload",
    file.name,
    filePath,
    buf.byteLength,
    meta.width ?? null,
    meta.height ?? null
  );

  return NextResponse.json(asset);
}
