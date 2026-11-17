import { NextRequest, NextResponse } from "next/server";
import { defaultAIProvider } from "@/lib/ai/nvidia-provider";
import { ZodError } from "zod";

export const maxDuration = 60; // Allow up to 60s for LLM generation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { topic, apiKey: bodyApiKey, model } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid educational topic." },
        { status: 400 }
      );
    }

    if (topic.trim().length > 300) {
      return NextResponse.json(
        { success: false, error: "Topic title must be under 300 characters." },
        { status: 400 }
      );
    }

    // Priority: custom header -> body -> environment variable
    const headerApiKey = req.headers.get("x-nvidia-api-key");
    const activeApiKey = headerApiKey || bodyApiKey;

    const lesson = await defaultAIProvider.generateLesson(topic.trim(), {
      apiKey: activeApiKey,
      model,
    });

    return NextResponse.json({
      success: true,
      lesson,
    });
  } catch (error: unknown) {
    console.error("Error in /api/generate-lesson:", error);

    let message = "An error occurred while generating the lesson.";
    let status = 500;

    if (error instanceof ZodError) {
      message = `AI produced an invalid lesson schema: ${error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`;
      status = 502;
    } else if (error instanceof Error) {
      message = error.message;
      if (message.includes("API Key is missing") || message.includes("Authentication failed")) {
        status = 401;
      } else if (message.includes("rate limit")) {
        status = 429;
      } else if (message.includes("timed out")) {
        status = 504;
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status }
    );
  }
}
