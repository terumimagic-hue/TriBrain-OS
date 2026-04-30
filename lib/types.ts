export type ProviderId = "openai" | "anthropic" | "gemini";

export type ModeId =
  | "general"
  | "business"
  | "code"
  | "book"
  | "marketing"
  | "legal"
  | "research";

export interface ProviderAnswer {
  provider: ProviderId;
  model: string;
  content: string;
  latencyMs: number;
  ok: true;
  inputTokens?: number;
  outputTokens?: number;
}

export interface ProviderError {
  provider: ProviderId;
  model: string;
  error: string;
  latencyMs: number;
  ok: false;
}

export type ProviderResult = ProviderAnswer | ProviderError;

export interface DebateRound {
  round: number;
  results: ProviderResult[];
}

export interface CouncilSession {
  id: string;
  prompt: string;
  mode: ModeId;
  createdAt: string;
  results: ProviderResult[];
  synthesis?: string;
  synthesisProvider?: ProviderId;
  debateRounds?: DebateRound[];
}
