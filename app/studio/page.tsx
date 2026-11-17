"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lesson } from "@/types/lesson";
import { TeachingStudio } from "@/components/studio/TeachingStudio";
import { EXEMPLAR_LESSONS } from "@/lib/data/exemplar-lessons";
import { Loader2, AlertCircle, ArrowLeft, RefreshCw, Compass } from "lucide-react";
import Link from "next/link";

function StudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const topicParam = searchParams.get("topic");
  const exemplarParam = searchParams.get("exemplar");
  const levelParam = searchParams.get("level") || "beginner";

  useEffect(() => {
    // 1. Check if an exemplar is directly requested
    if (exemplarParam && EXEMPLAR_LESSONS[exemplarParam]) {
      setLesson(EXEMPLAR_LESSONS[exemplarParam]);
      setIsLoading(false);
      return;
    }

    // 2. Check if topic matches an exemplar
    if (topicParam) {
      const lowerTopic = topicParam.toLowerCase();
      if (lowerTopic.includes("heart") && EXEMPLAR_LESSONS.heart) {
        setLesson(EXEMPLAR_LESSONS.heart);
        setIsLoading(false);
        return;
      } else if (lowerTopic.includes("photosynthesis") && EXEMPLAR_LESSONS.photosynthesis) {
        setLesson(EXEMPLAR_LESSONS.photosynthesis);
        setIsLoading(false);
        return;
      } else if (lowerTopic.includes("api") && EXEMPLAR_LESSONS.api) {
        setLesson(EXEMPLAR_LESSONS.api);
        setIsLoading(false);
        return;
      } else if (lowerTopic.includes("newton") && EXEMPLAR_LESSONS.newton) {
        setLesson(EXEMPLAR_LESSONS.newton);
        setIsLoading(false);
        return;
      } else if (
        (lowerTopic.includes("react") || lowerTopic.includes("native")) &&
        (EXEMPLAR_LESSONS.react_native || (EXEMPLAR_LESSONS as any).reactnative)
      ) {
        setLesson(EXEMPLAR_LESSONS.react_native || (EXEMPLAR_LESSONS as any).reactnative);
        setIsLoading(false);
        return;
      }
    }

    // 3. Check sessionStorage for recently generated lesson
    try {
      const stored = sessionStorage.getItem("braynix_active_lesson");
      if (stored) {
        const parsed: Lesson = JSON.parse(stored);
        if (!topicParam || parsed.topic.toLowerCase() === topicParam.toLowerCase()) {
          setLesson(parsed);
          setIsLoading(false);
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }

    // 4. Custom topic -> live AI generation
    if (topicParam) {
      generateLiveLesson(topicParam, levelParam);
    } else {
      setLesson(EXEMPLAR_LESSONS.heart);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicParam, exemplarParam, levelParam]);

  const generateLiveLesson = async (targetTopic: string, level: string) => {
    setIsLoading(true);
    setError(null);

    let clientApiKey = "";
    let clientModel = "";
    try {
      clientApiKey = localStorage.getItem("braynix_nvidia_key") || "";
      clientModel = localStorage.getItem("braynix_nvidia_model") || "";
    } catch {}

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
          apiKey: clientApiKey,
          model: clientModel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to synthesize lesson.");
      }

      setLesson(data.lesson);

      try {
        sessionStorage.setItem("braynix_active_lesson", JSON.stringify(data.lesson));
      } catch {}
    } catch (err: unknown) {
      console.error("Live lesson generation failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while communicating with the AI service."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0d10] text-[#f6f4ef] p-6 editorial-desk-grid">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 font-mono text-lg font-semibold text-electric ring-1 ring-electric/30 shadow-[0_0_25px_rgba(22,119,255,0.25)] mb-6 animate-pulse">
          BX
        </div>
        <h2 className="text-2xl font-serif font-bold text-white mb-2">
          Composing Interactive Masterclass
        </h2>
        <p className="text-xs text-neutral-400 max-w-md text-center leading-relaxed mb-6 font-sans">
          NVIDIA NIM is structuring visual smartboard vectors, sequencing teaching segments, and composing narration for{" "}
          <span className="text-electric font-semibold font-serif italic text-sm">
            &ldquo;{topicParam || "your topic"}&rdquo;
          </span>
          ...
        </p>
        <div className="flex items-center space-x-2 text-xs font-mono text-electric bg-electric/10 border border-electric/25 px-4 py-2 rounded-full">
          <Loader2 className="w-4 h-4 animate-spin text-electric" />
          <span>Generating SVG diagrams and synchronized lesson...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0c0d10] text-[#f6f4ef] p-6 editorial-desk-grid">
        <div className="w-full max-w-lg bg-[#121620] border border-rose-500/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-[#282d3b] text-rose-400">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <h2 className="text-base font-serif font-bold text-white">Lesson Generation Notice</h2>
          </div>
          <div className="py-4 text-xs text-neutral-300 space-y-3 leading-relaxed">
            <p className="bg-rose-950/40 p-3 rounded-xl border border-rose-900/50 font-mono text-rose-300">
              {error}
            </p>
            <p className="text-neutral-400 font-sans">
              You can provide your free NVIDIA NIM API key in the studio settings, or explore one of the pre-rendered masterclasses below:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
              <button
                onClick={() => {
                  setLesson(EXEMPLAR_LESSONS.heart);
                  setError(null);
                }}
                className="p-2.5 rounded-xl bg-[#141720] hover:bg-[#181c28] text-xs text-neutral-200 border border-[#282d3b] hover:border-electric/40 transition-colors text-left"
              >
                🫀 Human Heart
              </button>
              <button
                onClick={() => {
                  setLesson(EXEMPLAR_LESSONS.photosynthesis);
                  setError(null);
                }}
                className="p-2.5 rounded-xl bg-[#141720] hover:bg-[#181c28] text-xs text-neutral-200 border border-[#282d3b] hover:border-electric/40 transition-colors text-left"
              >
                🌿 Photosynthesis
              </button>
              <button
                onClick={() => {
                  setLesson(EXEMPLAR_LESSONS.api);
                  setError(null);
                }}
                className="p-2.5 rounded-xl bg-[#141720] hover:bg-[#181c28] text-xs text-neutral-200 border border-[#282d3b] hover:border-electric/40 transition-colors text-left"
              >
                🌐 How an API Works
              </button>
              <button
                onClick={() => {
                  setLesson(EXEMPLAR_LESSONS.newton);
                  setError(null);
                }}
                className="p-2.5 rounded-xl bg-[#141720] hover:bg-[#181c28] text-xs text-neutral-200 border border-[#282d3b] hover:border-electric/40 transition-colors text-left"
              >
                🍎 Newton&apos;s Laws
              </button>
              <button
                onClick={() => {
                  setLesson(EXEMPLAR_LESSONS.react_native);
                  setError(null);
                }}
                className="p-2.5 rounded-xl bg-[#141720] hover:bg-[#181c28] text-xs text-neutral-200 border border-[#282d3b] hover:border-electric/40 transition-colors text-left"
              >
                ⚛️ React Native
              </button>
            </div>
          </div>
          <div className="pt-4 border-t border-[#282d3b] flex items-center justify-between font-mono text-xs">
            <Link
              href="/"
              className="flex items-center space-x-1.5 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Topics</span>
            </Link>
            {topicParam && (
              <button
                onClick={() => generateLiveLesson(topicParam, levelParam)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-electric hover:bg-[#0a4fbf] text-white transition-colors shadow-sm font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Generation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return null;
  }

  return <TeachingStudio initialLesson={lesson} />;
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#0c0d10] text-[#f6f4ef]">
          <Loader2 className="w-8 h-8 animate-spin text-electric" />
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
