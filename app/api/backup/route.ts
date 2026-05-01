import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import path from "node:path";
import archiver from "archiver";
import { PassThrough } from "node:stream";
import { getDB } from "@/lib/db/client";

export const runtime = "nodejs";
export const maxDuration = 600;

function dataDir() {
  const dbPath = process.env.BOOKBRAIN_DB_PATH || path.join(process.cwd(), "data", "bookbrain.db");
  return path.dirname(dbPath);
}

export async function GET(): Promise<Response> {
  // Use SQLite VACUUM INTO to produce a clean backup file
  const dir = dataDir();
  const tmpPath = path.join(dir, `__backup_${Date.now()}.db`);
  try {
    if (existsSync(tmpPath)) await fs.unlink(tmpPath).catch(() => {});
    const db = getDB();
    db.prepare(`VACUUM INTO ?`).run(tmpPath);
  } catch (err) {
    return NextResponse.json({ error: `backup failed: ${(err as Error).message}` }, { status: 500 });
  }

  const archive = archiver("zip", { zlib: { level: 9 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  archive.file(tmpPath, { name: "bookbrain.db" });

  const exportsDir = path.join(dir, "exports");
  if (existsSync(exportsDir)) archive.directory(exportsDir, "exports");

  archive.append(JSON.stringify({
    bookbrain_backup: true,
    created_at: new Date().toISOString(),
    version: 1
  }, null, 2), { name: "bookbrain_backup.json" });

  archive.finalize().catch(() => {});

  const chunks: Buffer[] = [];
  for await (const chunk of passthrough as AsyncIterable<Buffer>) chunks.push(chunk);
  await fs.unlink(tmpPath).catch(() => {});
  const zip = Buffer.concat(chunks);
  const ab = zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer;
  return new NextResponse(ab, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="bookbrain_backup_${new Date().toISOString().slice(0,10)}.zip"`
    }
  });
}
