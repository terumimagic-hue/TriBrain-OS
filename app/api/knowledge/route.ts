import { NextResponse } from "next/server";
import { Knowledge } from "@/lib/db/models";
import { retrieveKnowledge } from "@/lib/agents/retrieval";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const kind = url.searchParams.get("kind") || undefined;
  if (q) {
    const hits = await retrieveKnowledge(q, { kinds: kind ? [kind] : undefined });
    return NextResponse.json({
      hits: hits.map((h) => ({
        id: h.item.id,
        kind: h.item.kind,
        title: h.item.title,
        content: h.item.content,
        project_id: h.item.project_id,
        score: h.score
      }))
    });
  }
  const items = Knowledge.list({ kind });
  return NextResponse.json({ items });
}
