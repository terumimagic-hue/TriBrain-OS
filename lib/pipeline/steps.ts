export type StepId =
  | "research"
  | "concept"
  | "structure"
  | "drafting"
  | "editorial"
  | "factcheck"
  | "revision"
  | "kdp"
  | "export"
  | "ingestion";

export interface StepDef {
  id: StepId;
  label: string;
  description: string;
  agent: "gemini" | "claude" | "james" | "system";
  dependsOn: StepId[];
}

export const STEPS: StepDef[] = [
  {
    id: "research",
    label: "Research",
    description: "Market, reader, sources, risks.",
    agent: "gemini",
    dependsOn: []
  },
  {
    id: "concept",
    label: "Concept",
    description: "Thesis, promise, positioning, go/no-go.",
    agent: "james",
    dependsOn: ["research"]
  },
  {
    id: "structure",
    label: "Structure",
    description: "TOC, chapter roles, pacing, target word counts.",
    agent: "claude",
    dependsOn: ["concept"]
  },
  {
    id: "drafting",
    label: "Drafting",
    description: "Full chapter prose, one chapter at a time.",
    agent: "claude",
    dependsOn: ["structure"]
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Commercial diagnosis and notes.",
    agent: "james",
    dependsOn: ["drafting"]
  },
  {
    id: "factcheck",
    label: "Fact Check",
    description: "Factual / risky claims.",
    agent: "gemini",
    dependsOn: ["drafting"]
  },
  {
    id: "revision",
    label: "Revision",
    description: "Apply notes per chapter.",
    agent: "claude",
    dependsOn: ["editorial", "factcheck"]
  },
  {
    id: "kdp",
    label: "KDP Package",
    description: "Title, description, keywords, A+, cover prompt.",
    agent: "james",
    dependsOn: ["revision"]
  },
  {
    id: "export",
    label: "Export",
    description: "Manuscript .md / .docx, KDP md, reports, summary.",
    agent: "system",
    dependsOn: ["kdp"]
  },
  {
    id: "ingestion",
    label: "Ingestion",
    description: "Distill into reusable knowledge for future books.",
    agent: "james",
    dependsOn: ["kdp"]
  }
];

export function getStep(id: StepId): StepDef {
  const s = STEPS.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown step: ${id}`);
  return s;
}
