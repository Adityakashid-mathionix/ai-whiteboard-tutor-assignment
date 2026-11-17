import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { defaultAIProvider } from "@/lib/ai/nvidia-provider";
import { AIProviderError, httpStatusForError } from "@/lib/ai/errors";
import { GenerateLessonRequestSchema, formatZodError } from "@/lib/schemas/api-schema";
import { checkRateLimit, clientKey, rateLimitHeaders, readJsonBody } from "@/lib/rate-limit";

export const maxDuration = 60; // Allow up to 60s for LLM generation

/** Callers spending their own key get a far looser limit. */
const SHARED_KEY_RULE = { limit: 8, windowMs: 60_000 };
const OWN_KEY_RULE = { limit: 40, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  try {
    const body = await readJsonBody(req);
    if (!body.ok) {
      return NextResponse.json(
        { success: false, error: body.error },
        { status: body.status }
      );
    }

    const parsed = GenerateLessonRequestSchema.safeParse(body.data);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { topic, level, model } = parsed.data;

    // Priority: custom header -> body -> server environment variable.
    const headerApiKey = req.headers.get("x-nvidia-api-key")?.trim();
    const activeApiKey = headerApiKey || parsed.data.apiKey;

    const limit = checkRateLimit(
      `lesson:${clientKey(req)}:${activeApiKey ? "own" : "shared"}`,
      activeApiKey ? OWN_KEY_RULE : SHARED_KEY_RULE
    );

    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many lesson requests. Try again in ${limit.retryAfterSeconds}s, or add your own NVIDIA API key in Studio settings.`,
        },
        { status: 429, headers: rateLimitHeaders(limit) }
      );
    }

    const startTime = Date.now();
    const { lesson, source } = await defaultAIProvider.generateLesson(topic, {
      apiKey: activeApiKey,
      model,
      level,
    });
    const durationMs = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        lesson,
        // "ai" = freshly generated, "cache" = previously generated, "fallback" =
        // offline outline because the model was unreachable. The studio shows a
        // banner for "fallback" so a template is never passed off as a lesson.
        source,
        latencyMs: durationMs,
      },
      {
        headers: {
          ...rateLimitHeaders(limit),
          "Server-Timing": `ai;dur=${durationMs}`,
          // POST responses are not shared-cacheable; lessons are cached in-process
          // by lib/cache/lesson-cache instead.
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Error in /api/generate-lesson:", error);

    if (error instanceof AIProviderError) {
      return NextResponse.json(
        { success: false, error: error.message, kind: error.kind },
        { status: error.status }
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: `AI produced an invalid lesson schema: ${formatZodError(error)}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while generating the lesson.",
      },
      { status: httpStatusForError(error) }
    );
  }
}
