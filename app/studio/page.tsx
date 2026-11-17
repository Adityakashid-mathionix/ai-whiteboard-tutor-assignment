"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lesson } from "@/types/lesson";
import { TeachingStudio } from "@/components/studio/TeachingStudio";
import { EXEMPLAR_LESSONS } from "@/lib/data/exemplar-lessons";
import { Loader2, AlertCircle, ArrowLeft, RefreshCw, Sparkles } from "lucide-react";
import Link from "next/link";

function StudioContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const topicParam = searchParams.get("topic");
  const exemplarParam = searchParams.get("exemplar");

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
      } else if ((lowerTopic.includes("react") || lowerTopic.includes("native")) && EXEMPLAR_LESSONS.reactnative) {
        setLesson(EXEMPLAR_LESSONS.reactnative);
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
      // Ignore sessionStorage parse errors
    }

    // 4. If a custom topic is requested, trigger live AI generation
    if (topicParam) {
      generateLiveLesson(topicParam);
    } else {
      // Default to heart exemplar if no parameters provided
      setLesson(EXEMPLAR_LESSONS.heart);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicParam, exemplarParam]);

  const generateLiveLesson = async (targetTopic: string) => {
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
          apiKey: clientApiKey,
          model: clientModel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Failed to generate lesson with AI tutor."
        );
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#080c14] text-slate-100 p-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-sky-500/20 mb-6 animate-bounce">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white mb-2">
          Generating Interactive Lesson
        </h2>
        <p className="text-xs text-slate-400 max-w-md text-center leading-relaxed mb-6">
          NVIDIA NIM is designing visual whiteboard actions, structuring teaching segments, and composing spoken narration for{" "}
          <span className="text-sky-400 font-semibold font-mono">
            &ldquo;{topicParam || "your topic"}&rdquo;
          </span>
          ...
        </p>
        <div className="flex items-center space-x-2 text-xs text-sky-400 bg-sky-950/40 border border-sky-800/50 px-4 py-2 rounded-full">
          <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
          <span>Structuring ~2 minute masterclass...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#080c14] text-slate-100 p-6">
        <div className="w-full max-w-lg bg-slate-900 border border-rose-900/60 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800 text-rose-400">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <h2 className="text-base font-bold text-white">Lesson Generation Notice</h2>
          </div>
          <div className="py-4 text-xs text-slate-300 space-y-3 leading-relaxed">
            <p className="bg-rose-950/30 p-3 rounded-xl border border-rose-800/40 font-mono text-rose-300">
              {error}
            </p>
            <p className="text-slate-400">
              If this is related to missing or restricted API keys, you can provide your free NVIDIA NIM key in the settings, or explore one of the pre-rendered exemplar lessons below:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <button
                onClick={() => {
                  setLesson(EXEMPLAR_LESSONS.heart);
                  setError(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors text-left"
              >
                🫀 Human Heart
              </button>
              <button
                onClick={() => {
                  setLesson(EXEMPLAR_LESSONS.photosynthesis);
                  setError(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors text-left"
              >
                🌿 Photosynthesis
              </button>
              <button
                onClick={() => {
                  setLesson(EXEMPLAR_LESSONS.api);
                  setError(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors text-left"
              >
                🌐 How an API Works
              </button>
              <button
                onClick={() => {
                  setLesson(EXEMPLAR_LESSONS.newton);
                  setError(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors text-left"
              >
                🚀 Newton&apos;s Third Law
              </button>
              <button
                onClick={() => {
                  setLesson(EXEMPLAR_LESSONS.reactnative);
                  setError(null);
                }}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors text-left sm:col-span-2"
              >
                📱 React Native Architecture
              </button>
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Topics</span>
            </Link>
            {topicParam && (
              <button
                onClick={() => generateLiveLesson(topicParam)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center space-x-1.5"
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
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#080c14] text-slate-100 p-6">
        <p className="text-sm text-slate-400 mb-4">No active lesson found.</p>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-semibold text-xs"
        >
          Select a Topic
        </Link>
      </div>
    );
  }

  return <TeachingStudio initialLesson={lesson} />;
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#080c14] text-slate-400 text-xs">
          Loading Whiteboard Studio...
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
