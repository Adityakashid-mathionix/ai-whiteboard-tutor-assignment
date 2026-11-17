"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lesson } from "@/types/lesson";
import { TeachingStudio } from "@/components/studio/TeachingStudio";
import { AlertCircle, ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import type { LessonSource } from "@/lib/cache/lesson-cache";

/**
 * Exemplars are a 68 KB module, so they are imported on demand rather than
 * shipped in the studio bundle for every visitor.
 */
async function loadExemplar(slug: string): Promise<Lesson | null> {
  const { EXEMPLAR_LESSONS } = await import("@/lib/data/exemplar-lessons");
  return (EXEMPLAR_LESSONS as Record<string, Lesson>)[slug] ?? null;
}

function StudioContent() {
  const searchParams = useSearchParams();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [source, setSource] = useState<LessonSource>("ai");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const topicParam = searchParams.get("topic");
  const exemplarParam = searchParams.get("exemplar");
  const levelParam = searchParams.get("level") || "beginner";

  const generateLiveLesson = useCallback(
    async (targetTopic: string, level: string) => {
      setIsLoading(true);
      setError(null);

      let clientApiKey = "";
      let clientModel = "";
      try {
        clientApiKey = localStorage.getItem("braynix_nvidia_key") || "";
        clientModel = localStorage.getItem("braynix_nvidia_model") || "";
      } catch {
        // Private mode: fall back to the server's key.
      }

      try {
        const response = await fetch("/api/generate-lesson", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(clientApiKey ? { "x-nvidia-api-key": clientApiKey } : {}),
          },
          body: JSON.stringify({
            topic: targetTopic,
            level,
            ...(clientModel ? { model: clientModel } : {}),
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || "Failed to build this lesson.");
        }

        setLesson(data.lesson);
        setSource((data.source as LessonSource) || "ai");

        try {
          sessionStorage.setItem("braynix_active_lesson", JSON.stringify(data.lesson));
        } catch {
          // Storage full or blocked: the lesson still plays from memory.
        }
      } catch (err: unknown) {
        console.error("Live lesson generation failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while reaching the AI tutor."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // 1. An explicitly requested exemplar, by exact slug only. Topic text is
      //    never substring-matched against exemplars: "capital markets" must not
      //    silently open the API lesson.
      if (exemplarParam) {
        const exemplar = await loadExemplar(exemplarParam);
        if (cancelled) return;

        if (exemplar) {
          setLesson(exemplar);
          setSource("exemplar");
          setIsLoading(false);
          return;
        }
      }

      // 2. A lesson generated moments ago for this exact topic.
      if (topicParam) {
        try {
          const stored = sessionStorage.getItem("braynix_active_lesson");
          if (stored) {
            const parsed: Lesson = JSON.parse(stored);
            if (parsed.topic?.toLowerCase().trim() === topicParam.toLowerCase().trim()) {
              if (cancelled) return;
              setLesson(parsed);
              setSource("cache");
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Corrupt session payload: regenerate instead.
        }

        await generateLiveLesson(topicParam, levelParam);
        return;
      }

      // 3. Nothing requested: open the heart masterclass as a demo.
      const fallback = await loadExemplar("heart");
      if (cancelled) return;
      setLesson(fallback);
      setSource("exemplar");
      setIsLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [topicParam, exemplarParam, levelParam, generateLiveLesson]);

  if (isLoading) {
    return (
      <div className="desk-grid flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <svg width="120" height="34" viewBox="0 0 120 34" aria-hidden="true" className="text-electric">
          <path
            d="M4 24 C 22 6, 40 6, 58 18 S 98 28, 116 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="200"
            strokeDashoffset="200"
          >
            <animate attributeName="stroke-dashoffset" values="200;0;200" dur="2.4s" repeatCount="indefinite" />
          </path>
        </svg>
        <h2 className="display-hand mt-5 text-4xl">Planning your lesson…</h2>
        <p className="prose-paper mt-2 max-w-md text-[15px]">
          Writing the chapters, picking the diagram for each one and preparing the narration
          for <span className="font-semibold italic">“{topicParam || "your topic"}”</span>.
        </p>
        <span className="mt-6 flex items-center gap-2 rounded-full border border-electric/25 bg-electric/5 px-4 py-2 font-mono text-[11px] text-electric">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          this usually takes a few seconds
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="desk-grid flex min-h-screen items-center justify-center bg-background p-6">
        <div className="paper-card w-full max-w-lg p-6">
          <div className="flex items-center gap-3 border-b border-border pb-4 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <h2 className="text-sm font-semibold text-foreground">Could not build this lesson</h2>
          </div>

          <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 font-mono text-xs text-destructive">
            {error}
          </p>
          <p className="mt-3 text-[13px] text-muted-foreground">
            Add your own free NVIDIA NIM key in Studio settings, or open one of the pre-built
            masterclasses from the home page.
          </p>

          <div className="mt-5 flex items-center justify-between border-t border-border pt-4 font-mono text-xs">
            <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              back to topics
            </Link>
            {topicParam && (
              <button
                onClick={() => generateLiveLesson(topicParam, levelParam)}
                className="btn-interactive flex items-center gap-1.5 rounded-lg bg-electric px-3 py-1.5 font-semibold text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) return null;

  return <TeachingStudio initialLesson={lesson} source={source} />;
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-electric" />
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
