import { NextResponse } from "next/server";
import { getDB } from "@/lib/db/client";

export const runtime = "nodejs";

// Mark all runs that have been "running" for > 10 minutes as errored.
// This recovers the UI after a server restart killed an in-flight pipeline.
export async function POST(): Promise<Response> {
  const db = getDB();
  const result = db.prepare(
    `UPDATE agent_run
        SET status = 'error',
            error = COALESCE(error, '') || ' [recovered: stuck > 10 min]',
            finished_at = datetime('now')
      WHERE status = 'running'
        AND (julianday('now') - julianday(started_at)) * 24 * 60 > 10`
  ).run();
  return NextResponse.json({ recovered: result.changes });
}
