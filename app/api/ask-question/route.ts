import { NextRequest, NextResponse } from "next/server";
import { defaultAIProvider } from "@/lib/ai/nvidia-provider";

export const maxDuration = 45;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, topic, lesson, history = [], apiKey: bodyApiKey, model } = body;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid question." },
        { status: 400 }
      );
    }

    if (!lesson) {
      return NextResponse.json(
        { success: false, error: "Lesson context is missing." },
        { status: 400 }
      );
    }

    const headerApiKey = req.headers.get("x-nvidia-api-key");
    const activeApiKey = headerApiKey || bodyApiKey;

    const answer = await defaultAIProvider.askQuestion(
      question.trim(),
      {
        topic: topic || lesson.topic || "Educational Topic",
        lesson,
        history,
      },
      {
        apiKey: activeApiKey,
        model,
      }
    );

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error: unknown) {
    console.error("Error in /api/ask-question:", error);

    let message = "Failed to answer follow-up question.";
    let status = 500;

    if (error instanceof Error) {
      message = error.message;
      if (message.includes("API Key is missing") || message.includes("Authentication failed")) {
        status = 401;
      } else if (message.includes("rate limit")) {
        status = 429;
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
