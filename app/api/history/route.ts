import { NextResponse } from "next/server";
import { listSessions } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  const sessions = await listSessions();
  const summary = sessions.map((s) => ({
    id: s.id,
    prompt: s.prompt,
    mode: s.mode,
    createdAt: s.createdAt,
    hasSynthesis: Boolean(s.synthesis),
    hasDebate: Boolean(s.debateRounds?.length)
  }));
  return NextResponse.json(summary);
}
