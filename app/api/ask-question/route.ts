import { NextRequest, NextResponse } from "next/server";
import { defaultAIProvider } from "@/lib/ai/nvidia-provider";
import { AIProviderError, httpStatusForError } from "@/lib/ai/errors";
import {
  AskQuestionRequestSchema,
  formatZodError,
  toLessonDigest,
} from "@/lib/schemas/api-schema";
import { checkRateLimit, clientKey, rateLimitHeaders } from "@/lib/rate-limit";

export const maxDuration = 45;

const SHARED_KEY_RULE = { limit: 15, windowMs: 60_000 };
const OWN_KEY_RULE = { limit: 60, windowMs: 60_000 };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const raw = body as Record<string, unknown>;

    // Accept either a compact digest or a full lesson object, and reduce the
    // latter server-side so visualActions never influence the prompt.
    let candidate = raw;
    if (raw.lesson && typeof raw.lesson === "object") {
      candidate = {
        ...raw,
        lesson: toLessonDigest(raw.lesson as Parameters<typeof toLessonDigest>[0]),
      };
    }

    const parsed = AskQuestionRequestSchema.safeParse(candidate);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { question, lesson, history, model } = parsed.data;

    const headerApiKey = req.headers.get("x-nvidia-api-key")?.trim();
    const activeApiKey = headerApiKey || parsed.data.apiKey;

    const limit = checkRateLimit(
      `question:${clientKey(req)}:${activeApiKey ? "own" : "shared"}`,
      activeApiKey ? OWN_KEY_RULE : SHARED_KEY_RULE
    );

    if (!limit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many questions in a short time. Try again in ${limit.retryAfterSeconds}s.`,
        },
        { status: 429, headers: rateLimitHeaders(limit) }
      );
    }

    const answer = await defaultAIProvider.askQuestion(
      question,
      { lesson, history },
      { apiKey: activeApiKey, model }
    );

    return NextResponse.json(
      { success: true, answer },
      { headers: rateLimitHeaders(limit) }
    );
  } catch (error: unknown) {
    console.error("Error in /api/ask-question:", error);

    if (error instanceof AIProviderError) {
      return NextResponse.json(
        { success: false, error: error.message, kind: error.kind },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to answer follow-up question.",
      },
      { status: httpStatusForError(error) }
    );
  }
}
