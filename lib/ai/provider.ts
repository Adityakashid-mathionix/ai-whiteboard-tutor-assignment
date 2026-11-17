import { GeneratedLesson } from "@/lib/cache/lesson-cache";
import { LessonDigest } from "@/lib/schemas/api-schema";

export interface AIProviderOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  /** Curriculum depth: beginner | intermediate | advanced. */
  level?: string;
  /** ISO language code the lesson should be taught in. */
  language?: string;
}

export interface QuestionContext {
  lesson: LessonDigest;
  history: { role: "user" | "assistant"; content: string }[];
}

export interface AIProvider {
  name: string;
  generateLesson(topic: string, options?: AIProviderOptions): Promise<GeneratedLesson>;
  askQuestion(
    question: string,
    context: QuestionContext,
    options?: AIProviderOptions
  ): Promise<string>;
}
