import { NextResponse } from "next/server";
import { CoverAssets, Projects } from "@/lib/db/models";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const project = Projects.get(params.id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(CoverAssets.byProject(project.id));
}
