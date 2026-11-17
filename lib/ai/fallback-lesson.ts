import { Lesson, LessonSchema } from "@/lib/schemas/lesson-schema";
import { EducationalVisualAsset } from "@/lib/visuals/visual-attribution";
import { normalizeLessonJson } from "./normalize-lesson";

export interface FallbackLessonOptions {
  visualAssets?: EducationalVisualAsset[];
  level?: string;
}

/**
 * Resilient fallback synthesizer.
 *
 * Used only when the upstream model is genuinely unreachable (5xx, network
 * failure, unparseable output). It produces a structured, schema-valid study
 * outline so the studio never crashes — but the caller MUST pass the
 * accompanying `source: "fallback"` flag to the client so the UI can say this
 * is a generic outline rather than a generated lesson, and the result is never
 * written to the lesson cache.
 */
export function createSynthesizedLesson(
  topic: string,
  options: FallbackLessonOptions = {}
): Lesson {
  const cleanTopic = topic.trim();
  const { visualAssets = [], level } = options;

  const rawJson = {
    title: `${cleanTopic}: Study Outline`,
    topic: cleanTopic,
    summary: `A structured starting outline for ${cleanTopic}, covering its foundations, internal mechanisms and real-world significance. Generated offline because the AI tutor could not be reached.`,
    estimatedDuration: 120,
    keyTakeaways: [
      `Foundational principles and structure of ${cleanTopic}.`,
      `How the main parts of ${cleanTopic} interact.`,
      `Where ${cleanTopic} matters in practice.`,
    ],
    segments: [
      {
        heading: `Foundations of ${cleanTopic}`,
        narration: `Let's start with the groundwork for ${cleanTopic}. Before any detail makes sense, we need the core idea: what problem it addresses, which conditions it depends on, and the vocabulary used to describe it.`,
        keyTakeaway: `${cleanTopic} rests on a small set of foundational principles.`,
      },
      {
        heading: `Internal structure and mechanisms`,
        narration: `Next we look inside ${cleanTopic}. The subject breaks down into distinct parts, each with a specific job, and the interesting behaviour comes from how those parts pass work between one another.`,
        keyTakeaway: `The behaviour of ${cleanTopic} emerges from interaction between its parts.`,
      },
      {
        heading: `Real-world impact`,
        narration: `Finally, where does ${cleanTopic} actually matter? Here we connect the principles to practice: where the concept is applied today, which constraints bite hardest, and what questions remain open.`,
        keyTakeaway: `Understanding ${cleanTopic} explains decisions made in real systems.`,
      },
    ],
  };

  const normalized = normalizeLessonJson(rawJson, {
    topic: cleanTopic,
    visualAssets,
    level,
  });

  return LessonSchema.parse(normalized) as Lesson;
}
