import { AIProvider, AIProviderOptions, QuestionContext } from "./provider";
import { LessonSchema } from "@/lib/schemas/lesson-schema";
import { buildFollowupSystemPrompt, buildLessonSystemPrompt } from "./prompts";
import { getVisualAssetsForTopic } from "@/lib/visuals/visual-provider";
import { EducationalVisualAsset } from "@/lib/visuals/visual-attribution";
import { GeneratedLesson, globalLessonCache } from "@/lib/cache/lesson-cache";
import { aiCircuitBreaker } from "./circuit-breaker";
import { AIProviderError, isFatalAIError } from "./errors";
import { normalizeLessonJson } from "./normalize-lesson";
import { createSynthesizedLesson } from "./fallback-lesson";
import { extractJSON } from "./extract-json";

const LESSON_TIMEOUT_MS = 60_000;
const QUESTION_TIMEOUT_MS = 45_000;

export class NvidiaNIMProvider implements AIProvider {
  name = "NVIDIA NIM (Hosted Inference)";

  private getApiKey(options?: AIProviderOptions): string {
    const key = options?.apiKey || process.env.NVIDIA_API_KEY;
    if (!key || key.trim() === "") {
      throw new AIProviderError(
        "auth",
        "NVIDIA API Key is missing. Set NVIDIA_API_KEY in .env.local, or enter your own key in the Studio settings."
      );
    }
    return key.trim();
  }

  private getModel(options?: AIProviderOptions): string {
    return (
      options?.model ||
      process.env.NVIDIA_MODEL ||
      "nvidia/nemotron-3.5-lightning-30b-a3b"
    );
  }

  private getBaseUrl(options?: AIProviderOptions): string {
    return (
      options?.baseUrl ||
      process.env.NVIDIA_BASE_URL ||
      "https://integrate.api.nvidia.com/v1"
    );
  }

  /** Single place where upstream HTTP failures become typed errors. */
  private async toProviderError(response: Response): Promise<AIProviderError> {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message || JSON.stringify(body);
    } catch {
      try {
        detail = await response.text();
      } catch {
        detail = "";
      }
    }

    if (response.status === 401 || response.status === 403) {
      return new AIProviderError(
        "auth",
        `Authentication failed with NVIDIA NIM: ${detail || "invalid API key"}. Please check your credentials.`
      );
    }

    if (response.status === 429) {
      return new AIProviderError(
        "rate_limit",
        "NVIDIA NIM rate limit exceeded. Please wait a moment before requesting another lesson."
      );
    }

    return new AIProviderError(
      "upstream",
      `NVIDIA NIM API error (${response.status}): ${detail || "unknown error"}`
    );
  }

  private async chat(
    body: Record<string, unknown>,
    options: AIProviderOptions | undefined,
    timeoutMs: number
  ): Promise<string> {
    const apiKey = this.getApiKey(options);
    const baseUrl = this.getBaseUrl(options);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await this.toProviderError(response);
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message;
      const content: string = message?.content?.trim() || message?.reasoning_content?.trim() || "";

      if (!content) {
        throw new AIProviderError("invalid_response", "Received an empty response from NVIDIA NIM.");
      }

      return content;
    } catch (err: unknown) {
      if (err instanceof AIProviderError) throw err;

      if (err instanceof Error && err.name === "AbortError") {
        throw new AIProviderError(
          "timeout",
          `Request to NVIDIA NIM timed out after ${Math.round(timeoutMs / 1000)} seconds. The server may be under high load.`
        );
      }

      throw new AIProviderError(
        "network",
        `Could not reach NVIDIA NIM: ${err instanceof Error ? err.message : String(err)}`,
        { cause: err }
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateLesson(
    topic: string,
    options?: AIProviderOptions
  ): Promise<GeneratedLesson> {
    const keyParts = {
      topic,
      model: this.getModel(options),
      level: options?.level,
      language: options?.language,
    };

    return globalLessonCache.getOrGenerate(keyParts, async () => {
      return aiCircuitBreaker.execute<GeneratedLesson>(
        async () => ({
          lesson: await this.fetchLesson(topic, options),
          source: "ai",
        }),
        async (error) => {
          console.warn(
            "[NvidiaNIMProvider] Upstream unavailable, serving labelled fallback outline:",
            error.message
          );

          let visualAssets: EducationalVisualAsset[] = [];
          try {
            visualAssets = await getVisualAssetsForTopic(topic);
          } catch {
            // A fallback lesson without images is still better than a crash.
          }

          return {
            lesson: createSynthesizedLesson(topic, {
              visualAssets,
              level: options?.level,
              language: options?.language,
            }),
            source: "fallback",
          };
        },
        // Missing key / exhausted quota are the caller's problem to see, not
        // something to paper over with a generic outline.
        { shouldFallback: (error) => !isFatalAIError(error) }
      );
    });
  }

  private async fetchLesson(topic: string, options?: AIProviderOptions) {
    // Surface a missing key before doing any other work.
    this.getApiKey(options);

    let visualAssets: EducationalVisualAsset[] = [];
    try {
      visualAssets = await getVisualAssetsForTopic(topic);
    } catch (assetErr) {
      console.warn("Visual assets retrieval notice:", assetErr);
    }

    const content = await this.chat(
      {
        model: this.getModel(options),
        messages: [
          {
            role: "system",
            content: buildLessonSystemPrompt({
              level: options?.level,
              language: options?.language,
            }),
          },
          {
            role: "user",
            content: `Please create a complete educational masterclass on the topic: "${topic.trim()}". Return the response strictly as valid JSON adhering to the whiteboard schema.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 6000,
        chat_template_kwargs: { thinking: false },
      },
      options,
      LESSON_TIMEOUT_MS
    );

    const jsonStr = extractJSON(content);

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      throw new AIProviderError(
        "invalid_response",
        `Failed to parse AI output as JSON: ${(parseErr as Error).message}`,
        { cause: parseErr }
      );
    }

    const normalized = normalizeLessonJson(parsed, {
      topic,
      visualAssets,
      level: options?.level,
      language: options?.language,
    });

    const result = LessonSchema.safeParse(normalized);
    if (!result.success) {
      throw new AIProviderError(
        "invalid_response",
        `AI produced a lesson that failed schema validation: ${result.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join(", ")}`
      );
    }

    return normalized;
  }

  async askQuestion(
    question: string,
    context: QuestionContext,
    options?: AIProviderOptions
  ): Promise<string> {
    const { lesson, history } = context;

    const lessonSummary = [
      `Topic: ${lesson.topic || lesson.title}`,
      `Lesson Title: ${lesson.title}`,
      `Overview: ${lesson.summary}`,
      "",
      "Segments Taught:",
      ...lesson.segments.map(
        (segment, idx) =>
          `${idx + 1}. ${segment.heading}: ${segment.narration}${
            segment.keyTakeaway ? ` (Key Takeaway: ${segment.keyTakeaway})` : ""
          }`
      ),
    ].join("\n");

    const messages = [
      {
        role: "system" as const,
        content: `${buildFollowupSystemPrompt({
          level: lesson.learningLevel,
          language: lesson.language,
        })}\n\n[LESSON CONTEXT]\n${lessonSummary}`,
      },
      ...history.slice(-6).map((turn) => ({
        role: turn.role,
        content: turn.content,
      })),
      { role: "user" as const, content: question },
    ];

    return this.chat(
      {
        model: this.getModel(options),
        messages,
        temperature: 0.4,
        max_tokens: 1024,
        chat_template_kwargs: { thinking: false },
      },
      options,
      QUESTION_TIMEOUT_MS
    );
  }
}

export const defaultAIProvider = new NvidiaNIMProvider();
