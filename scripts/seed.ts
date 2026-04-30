// Seed example: create a sample book project so the UI has something to look at.
// Run with: npm run seed
import { Projects, Series } from "../lib/db/models";

function main(): void {
  const series = Series.create(
    "BookBrain Demo Series",
    "Series demonstrating BookBrain OS knowledge accumulation.",
    "direct, no-fluff, evidence-based",
    { reader_address: "you", second_person: true, no_meta_commentary: true }
  );

  const project = Projects.create({
    workingTitle: "Tribrain — How three minds beat one",
    idea: "A short, evidence-based book arguing that combining three specialized AI agents (research, drafting, editorial) outperforms any single model. Aimed at solo founders, knowledge workers, and writers. Tone: no-fluff, direct, with concrete patterns and code-level examples.",
    language: "en",
    market: "US",
    tone: "direct, no-fluff, second person",
    estimatedWords: 22000,
    referenceBooks: ["Atomic Habits", "Show Your Work!", "The Lean Startup"],
    seriesId: series.id
  });

  console.log("Seeded:");
  console.log("  Series:", series.id, "—", series.name);
  console.log("  Project:", project.id, "—", project.working_title);
  console.log("\nVisit http://localhost:3000/projects/" + project.id);
}

main();
