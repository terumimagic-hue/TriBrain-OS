import { NextResponse } from "next/server";
import { getDB } from "@/lib/db/client";
import { J } from "@/lib/db/models";

interface StyleRow {
  id: string;
  project_id: string | null;
  series_id: string | null;
  voice: string | null;
  cadence: string | null;
  vocabulary: string | null;
  recurring_phrases: string | null;
  pov: string | null;
  do_use: string | null;
  do_not_use: string | null;
  meta: string | null;
  created_at: string;
}

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const rows = getDB().prepare(`
    SELECT sp.*, bp.title AS project_title, bp.working_title AS project_working_title
    FROM style_profile sp
    LEFT JOIN book_project bp ON bp.id = sp.project_id
    ORDER BY sp.created_at DESC
  `).all() as (StyleRow & { project_title: string | null; project_working_title: string | null })[];

  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      project_id: r.project_id,
      series_id: r.series_id,
      project_title: r.project_title || r.project_working_title,
      voice: r.voice,
      cadence: r.cadence,
      pov: r.pov,
      recurring_phrases: J.parse<string[]>(r.recurring_phrases, []),
      do_use: J.parse<string[]>(r.do_use, []),
      do_not_use: J.parse<string[]>(r.do_not_use, [])
    }))
  );
}
