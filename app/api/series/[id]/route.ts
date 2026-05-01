import { NextResponse } from "next/server";
import { Series, J } from "@/lib/db/models";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const s = Series.get(params.id);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ...s, rules: J.parse<unknown>(s.rules, null) });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.description !== undefined) patch.description = body.description;
  if (body.tone !== undefined) patch.tone = body.tone;
  if (body.rules !== undefined) patch.rules = J.stringify(body.rules);
  Series.update(params.id, patch as never);
  return NextResponse.json(Series.get(params.id));
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  Series.remove(params.id);
  return NextResponse.json({ ok: true });
}
