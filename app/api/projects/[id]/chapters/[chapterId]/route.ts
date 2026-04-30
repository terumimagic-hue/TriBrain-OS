import { NextResponse } from "next/server";
import { Chapters } from "@/lib/db/models";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string; chapterId: string } }
): Promise<Response> {
  const ch = Chapters.get(params.chapterId);
  if (!ch || ch.project_id !== params.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(ch);
}
