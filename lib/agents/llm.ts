import { askOpenAI, embedOpenAI } from "../providers/openai";
import { askAnthropic } from "../providers/anthropic";
import { askGemini } from "../providers/gemini";
import { Costs } from "../db/models";
import { estimateUSD } from "../providers/cost";
import type { ProviderResult } from "../types";

export type AgentName = "gemini" | "claude" | "james";

interface CallOptions {
  projectId?: string | null;
  agentRunId?: string | null;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  retries?: number;
}

async function withRetry<T extends ProviderResult>(
  fn: () => Promise<T>,
  retries: number
): Promise<T> {
  let last: T | null = null;
  for (let i = 0; i <= retries; i++) {
    const r = await fn();
    if (r.ok) return r;
    last = r;
    const msg = r.error.toLowerCase();
    if (!/(rate|timeout|temporar|overload|busy|503|502|429)/.test(msg)) break;
    await new Promise((res) => setTimeout(res, 1000 * Math.pow(2, i)));
  }
  return last as T;
}

export async function ask(agent: AgentName, system: string, user: string, opts: CallOptions = {}): Promise<ProviderResult> {
  const retries = opts.retries ?? 2;
  let result: ProviderResult;
  if (agent === "gemini") {
    result = await withRetry(() => askGemini(system, user, { temperature: opts.temperature, model: opts.model }), retries);
  } else if (agent === "claude") {
    result = await withRetry(() => askAnthropic(system, user, { temperature: opts.temperature, model: opts.model, maxTokens: opts.maxTokens }), retries);
  } else {
    result = await withRetry(() => askOpenAI(system, user, { temperature: opts.temperature, model: opts.model, maxTokens: opts.maxTokens }), retries);
  }

  if (result.ok) {
    const usd = estimateUSD(result.model, result.inputTokens ?? 0, result.outputTokens ?? 0);
    try {
      Costs.log(
        opts.projectId ?? null,
        opts.agentRunId ?? null,
        result.provider,
        result.model,
        result.inputTokens ?? 0,
        result.outputTokens ?? 0,
        usd
      );
    } catch {
      // costs logging shouldn't break the call
    }
  }
  return result;
}

export async function askJSON<T>(
  agent: AgentName,
  system: string,
  user: string,
  opts: CallOptions = {}
): Promise<{ data: T; raw: string } | { error: string; raw: string }> {
  const wrappedSystem = `${system}\n\nReturn ONLY a single valid JSON object that matches the requested schema. No prose, no markdown fences. If you must wrap in markdown, use \`\`\`json fences.`;
  const r = await ask(agent, wrappedSystem, user, opts);
  if (!r.ok) return { error: r.error, raw: "" };
  const cleaned = stripFences(r.content);
  try {
    const data = JSON.parse(cleaned) as T;
    return { data, raw: r.content };
  } catch (err) {
    return { error: `Invalid JSON: ${(err as Error).message}`, raw: r.content };
  }
}

function stripFences(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) return m[1].trim();
  return s.trim();
}

export { embedOpenAI };
