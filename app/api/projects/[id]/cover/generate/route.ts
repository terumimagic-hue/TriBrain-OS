import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import OpenAI from "openai";
import { CoverAssets, Costs, Kdp, Projects } from "@/lib/db/models";
import { uploadsDir } from "@/lib/cover/render";
import { newId } from "@/lib/db/client";
import { ensureCostBelowLimit, ensureFeature } from "@/lib/license/guards";

export const runtime = "nodejs";
export const maxDuration = 300;

interface Body {
  prompt?: string;
  size?: "1024x1536" | "1024x1024" | "1536x1024";
  model?: string;
  background?: "transparent" | "auto";
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const project = Projects.get(params.id);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  const feature = ensureFeature("aiCoverGen");
  if (!feature.ok) return NextResponse.json({ error: feature.error, hint: feature.hint }, { status: feature.status });
  const cost = ensureCostBelowLimit();
  if (!cost.ok) return NextResponse.json({ error: cost.error, hint: cost.hint }, { status: cost.status });

  const { Settings } = await import("@/lib/db/state");
  const apiKey = Settings.get().openai_key_override || process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY not set" }, { status: 400 });

  const body = (await req.json().catch(() => ({}))) as Body;

  const kdp = Kdp.byProject(project.id);
  const prompt = (body.prompt && body.prompt.trim())
    ? body.prompt.trim()
    : (kdp?.cover_prompt ?? `Book cover for "${project.title || project.working_title}". Striking, high-contrast, modern, no text, suitable as a book cover image.`);

  const size = body.size ?? "1024x1536";
  const model = body.model ?? "gpt-image-1";

  const client = new OpenAI({ apiKey });
  let imageBytes: Buffer;
  let usedModel = model;
  try {
    const r = await client.images.generate({ model, prompt, size, n: 1 });
    const data = r.data?.[0];
    if (data?.b64_json) {
      imageBytes = Buffer.from(data.b64_json, "base64");
    } else if (data?.url) {
      const fetched = await fetch(data.url);
      imageBytes = Buffer.from(await fetched.arrayBuffer());
    } else {
      throw new Error("Image API returned no data");
    }
  } catch (errA) {
    // Fallback to dall-e-3
    try {
      const fallback = "dall-e-3";
      const fallbackSize = size === "1024x1024" ? "1024x1024" : "1024x1792";
      const r = await client.images.generate({
        model: fallback,
        prompt,
        size: fallbackSize as "1024x1024" | "1024x1792",
        n: 1,
        response_format: "b64_json"
      });
      const data = r.data?.[0];
      if (!data?.b64_json) throw new Error("Image API returned no data");
      imageBytes = Buffer.from(data.b64_json, "base64");
      usedModel = fallback;
    } catch (errB) {
      return NextResponse.json(
        { error: `Image generation failed: ${(errB as Error).message}` },
        { status: 500 }
      );
    }
  }

  // Persist to uploads dir
  const dir = await uploadsDir(project.id);
  const filename = `cover_ai_${newId("ai")}.png`;
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, imageBytes);

  const meta = await sharp(imageBytes).metadata();
  const asset = CoverAssets.add(
    project.id,
    "ai",
    filename,
    filePath,
    imageBytes.byteLength,
    meta.width ?? null,
    meta.height ?? null,
    prompt
  );

  // Estimate cost: gpt-image-1 charges per output token; we don't have an accurate
  // count here, so log a flat per-image rate as a placeholder.
  Costs.log(project.id, null, "openai", usedModel, 0, 0, usedModel.startsWith("gpt-image") ? 0.04 : 0.04);

  return NextResponse.json({ asset, prompt, model: usedModel });
}
