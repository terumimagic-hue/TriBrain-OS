import { NextResponse } from "next/server";
import { Projects } from "@/lib/db/models";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const copy = Projects.duplicate(params.id);
  if (!copy) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(copy);
}
