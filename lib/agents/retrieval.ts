import { Knowledge, type KnowledgeItemRow } from "../db/models";
import { embedOpenAI } from "./llm";

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export interface KnowledgeHit {
  item: KnowledgeItemRow;
  score: number;
}

export async function retrieveKnowledge(query: string, opts: { topK?: number; excludeProjectId?: string; kinds?: string[] } = {}): Promise<KnowledgeHit[]> {
  const topK = opts.topK ?? Number(process.env.BOOKBRAIN_KNOWLEDGE_TOPK || 8);
  const all = Knowledge.all();
  if (!all.length) return [];

  const candidates = all.filter((it) => {
    if (opts.excludeProjectId && it.project_id === opts.excludeProjectId) return false;
    if (opts.kinds?.length && !opts.kinds.includes(it.kind)) return false;
    return true;
  });
  if (!candidates.length) return [];

  const queryEmb = await embedOpenAI(query);
  if (queryEmb) {
    const hits = candidates
      .map((it) => {
        if (!it.embedding) return null;
        try {
          const v = JSON.parse(it.embedding) as number[];
          return { item: it, score: cosine(queryEmb.vector, v) };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as KnowledgeHit[];
    if (hits.length) {
      return hits.sort((a, b) => b.score - a.score).slice(0, topK);
    }
  }

  // Fallback: keyword overlap scoring
  const qTokens = Array.from(tokenize(query));
  const scored = candidates.map((it) => {
    const cSet = tokenize(`${it.title || ""} ${it.content}`);
    const overlap = qTokens.filter((t) => cSet.has(t)).length;
    const denom = Math.sqrt(qTokens.length || 1) * Math.sqrt(cSet.size || 1);
    return { item: it, score: overlap / denom };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}

function tokenize(s: string): Set<string> {
  return new Set((s.toLowerCase().match(/[a-z0-9぀-ヿ㐀-鿿]+/g) || []).filter((t) => t.length > 2));
}

export function formatKnowledgeForPrompt(hits: KnowledgeHit[]): string {
  if (!hits.length) return "";
  return hits
    .map((h, i) => {
      const head = h.item.title ? `${i + 1}. [${h.item.kind}] ${h.item.title}` : `${i + 1}. [${h.item.kind}]`;
      return `${head}\n${h.item.content}`;
    })
    .join("\n\n");
}
