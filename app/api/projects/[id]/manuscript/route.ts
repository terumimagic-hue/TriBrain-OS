import { NextResponse } from "next/server";
import { Projects, Chapters } from "@/lib/db/models";
import { manuscriptMarkdown } from "@/lib/export/markdown";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const project = Projects.get(params.id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const chapters = Chapters.byProject(project.id);
  const md = manuscriptMarkdown(project, chapters);
  return new NextResponse(md, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" }
  });
}
