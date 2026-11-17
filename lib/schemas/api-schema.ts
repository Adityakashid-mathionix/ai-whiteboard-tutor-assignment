import { z } from "zod";

export const LearningLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);

/** Model ids are provider slugs such as "nvidia/nemotron-3.5-lightning-30b-a3b". */
export const ModelIdSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[A-Za-z0-9._\/-]+$/, "Model id contains unsupported characters.");

export const ApiKeySchema = z.string().trim().min(8).max(300);

export const GenerateLessonRequestSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(2, "Please provide a valid educational topic.")
    .max(300, "Topic title must be under 300 characters."),
  level: LearningLevelSchema.optional().default("beginner"),
  model: ModelIdSchema.optional(),
  apiKey: ApiKeySchema.optional(),
});

export type GenerateLessonRequest = z.infer<typeof GenerateLessonRequestSchema>;

/**
 * Compact lesson context for follow-up questions.
 *
 * The follow-up endpoint only needs the spoken content, so visualActions (which
 * dominate a lesson's size) are deliberately absent: sending them on every chat
 * message would cost tens of kilobytes per keystroke-turn for nothing.
 */
export const LessonDigestSchema = z.object({
  title: z.string().trim().min(1).max(300),
  summary: z.string().trim().max(2000).optional().default(""),
  topic: z.string().trim().max(300).optional(),
  learningLevel: LearningLevelSchema.optional().default("beginner"),
  segments: z
    .array(
      z.object({
        heading: z.string().trim().max(300),
        narration: z.string().trim().max(4000),
        keyTakeaway: z.string().trim().max(600).optional().default(""),
      })
    )
    .min(1)
    .max(12),
});

export type LessonDigest = z.infer<typeof LessonDigestSchema>;

export const ChatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

export const AskQuestionRequestSchema = z.object({
  question: z.string().trim().min(1, "Please provide a valid question.").max(1000),
  lesson: LessonDigestSchema,
  history: z.array(ChatTurnSchema).max(20).optional().default([]),
  model: ModelIdSchema.optional(),
  apiKey: ApiKeySchema.optional(),
});

export type AskQuestionRequest = z.infer<typeof AskQuestionRequestSchema>;

/** Reduces a full lesson object to the digest the follow-up endpoint needs. */
export function toLessonDigest(lesson: {
  title?: string;
  summary?: string;
  topic?: string;
  learningLevel?: string;
  segments?: { heading?: string; narration?: string; keyTakeaway?: string }[];
}): LessonDigest {
  return LessonDigestSchema.parse({
    title: lesson.title || lesson.topic || "Lesson",
    summary: lesson.summary || "",
    topic: lesson.topic,
    learningLevel: lesson.learningLevel || "beginner",
    segments: (lesson.segments || []).slice(0, 12).map((segment) => ({
      heading: segment.heading || "Chapter",
      narration: (segment.narration || "").slice(0, 4000),
      keyTakeaway: segment.keyTakeaway || "",
    })),
  });
}

/** Formats a ZodError into a single readable sentence. */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}
