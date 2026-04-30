import { NextResponse } from "next/server";
import { askAll } from "@/lib/providers";
import { getMode } from "@/lib/modes";
import { saveSession } from "@/lib/storage";
import { synthesize } from "@/lib/synthesis";
import { runDebate } from "@/lib/debate";
import { newId } from "@/lib/utils";
import type { CouncilSession, ModeId, ProviderId } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

interface CouncilRequest {
  prompt: string;
  mode?: ModeId;
  synthesize?: boolean;
  debate?: boolean;
  synthesisProvider?: ProviderId;
}

export async function POST(req: Request): Promise<Response> {
  let body: CouncilRequest;
  try {
    body = (await req.json()) as CouncilRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const mode = getMode(body.mode ?? "general");
  const session: CouncilSession = {
    id: newId(),
    prompt,
    mode: mode.id,
    createdAt: new Date().toISOString(),
    results: []
  };

  session.results = await askAll(mode.systemPrompt, prompt);

  if (body.debate) {
    session.debateRounds = await runDebate(prompt, session.results);
  }

  if (body.synthesize ?? true) {
    const lastRoundResults =
      session.debateRounds?.[session.debateRounds.length - 1]?.results ??
      session.results;
    const synth = await synthesize(prompt, lastRoundResults, body.synthesisProvider);
    if ("content" in synth) {
      session.synthesis = synth.content;
      session.synthesisProvider = synth.provider;
    } else {
      session.synthesis = `[Synthesis failed: ${synth.error}]`;
    }
  }

  try {
    await saveSession(session);
  } catch {
    // storage failure shouldn't block returning the result
  }

  return NextResponse.json(session);
}
