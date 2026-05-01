import { NextResponse } from "next/server";
import { Series, J } from "@/lib/db/models";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const items = Series.list();
  return NextResponse.json(
    items.map((s) => ({ ...s, rules: J.parse<unknown>(s.rules, null) }))
  );
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => ({}));
  if (!body?.name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const s = Series.create(
    String(body.name),
    body.description ?? undefined,
    body.tone ?? undefined,
    body.rules ?? null
  );
  return NextResponse.json(s);
}
