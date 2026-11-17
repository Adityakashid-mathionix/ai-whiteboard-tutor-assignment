import { Lesson } from "@/lib/schemas/lesson-schema";
import { ChatMessage } from "@/types/lesson";

export interface AIProviderOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface LessonContext {
  topic: string;
  lesson: Lesson;
  history: ChatMessage[];
}

export interface AIProvider {
  name: string;
  generateLesson(topic: string, options?: AIProviderOptions): Promise<Lesson>;
  askQuestion(
    question: string,
    context: LessonContext,
    options?: AIProviderOptions
  ): Promise<string>;
}
