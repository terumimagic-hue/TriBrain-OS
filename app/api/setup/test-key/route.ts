import { NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  provider: "openai" | "anthropic" | "gemini";
  apiKey: string;
  model?: string;
}

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.provider || !body.apiKey) {
    return NextResponse.json({ ok: false, error: "provider and apiKey required" }, { status: 400 });
  }
  try {
    const start = Date.now();
    let model = body.model || "";
    if (body.provider === "openai") {
      model = model || "gpt-4o-mini";
      const client = new OpenAI({ apiKey: body.apiKey });
      const r = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5
      });
      return NextResponse.json({
        ok: true,
        provider: "openai",
        model,
        latencyMs: Date.now() - start,
        sample: r.choices[0]?.message?.content?.slice(0, 40) || ""
      });
    }
    if (body.provider === "anthropic") {
      model = model || "claude-haiku-4-5-20251001";
      const client = new Anthropic({ apiKey: body.apiKey });
      const r = await client.messages.create({
        model,
        max_tokens: 16,
        messages: [{ role: "user", content: "ping" }]
      });
      const text = r.content
        .filter((b) => b.type === "text")
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("");
      return NextResponse.json({
        ok: true,
        provider: "anthropic",
        model,
        latencyMs: Date.now() - start,
        sample: text.slice(0, 40)
      });
    }
    if (body.provider === "gemini") {
      model = model || "gemini-2.0-flash";
      const client = new GoogleGenerativeAI(body.apiKey);
      const m = client.getGenerativeModel({ model });
      const r = await m.generateContent("ping");
      return NextResponse.json({
        ok: true,
        provider: "gemini",
        model,
        latencyMs: Date.now() - start,
        sample: r.response.text().slice(0, 40)
      });
    }
    return NextResponse.json({ ok: false, error: "unknown provider" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : String(err)
    }, { status: 200 });
  }
}
