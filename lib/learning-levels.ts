export type LearningLevel = "beginner" | "intermediate" | "advanced";

export const LEARNING_LEVELS: { id: LearningLevel; label: string; desc: string }[] = [
  { id: "beginner", label: "Foundational", desc: "Intuitive analogies & fundamental concepts" },
  { id: "intermediate", label: "Core Academic", desc: "Detailed mechanisms & balanced rigor" },
  { id: "advanced", label: "Deep Dive", desc: "Technical depth, architecture & formal proofs" },
];
