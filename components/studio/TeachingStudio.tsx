"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Lesson } from "@/types/lesson";
import type { LessonSource } from "@/lib/cache/lesson-cache";
import { useLessonPlayer } from "@/hooks/useLessonPlayer";
import { Whiteboard } from "./Whiteboard";
import { LessonOutline } from "./LessonOutline";
import { TutorPanel } from "./TutorPanel";
import { PlaybackControls } from "./PlaybackControls";
import { SettingsModal } from "./SettingsModal";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  Settings,
  Layers,
  GraduationCap,
  Monitor,
  Maximize2,
  TriangleAlert,
} from "lucide-react";

interface TeachingStudioProps {
  initialLesson: Lesson;
  /** Where this lesson came from; "fallback" is surfaced to the student. */
  source?: LessonSource;
}

export const TeachingStudio: React.FC<TeachingStudioProps> = ({
  initialLesson,
  source = "ai",
}) => {
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("nvidia/nemotron-3.5-lightning-30b-a3b");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [mobileTab, setMobileTab] = useState<"whiteboard" | "outline" | "tutor">("whiteboard");

  useEffect(() => {
    try {
      const storedKey = localStorage.getItem("braynix_nvidia_key");
      const storedModel = localStorage.getItem("braynix_nvidia_model");
      if (storedKey) setApiKey(storedKey);
      if (storedModel) setSelectedModel(storedModel);
    } catch {
      // Storage blocked: the server key is used instead.
    }
  }, []);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    try {
      localStorage.setItem("braynix_nvidia_key", newKey);
    } catch {
      // Nothing to persist to; the key still applies for this session.
    }
  };

  const handleSaveModel = (newModel: string) => {
    setSelectedModel(newModel);
    try {
      localStorage.setItem("braynix_nvidia_model", newModel);
    } catch {
      // As above.
    }
  };

  const onLessonComplete = useCallback(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#1677ff", "#059669", "#d97706", "#7c3aed"],
      });
    } catch {
      // Confetti is decorative only.
    }
  }, []);

  const player = useLessonPlayer({ lesson: initialLesson, onLessonComplete });

  const { status, currentSegmentIndex, totalSegments, isMuted } = player;
  const { play, pause, resume, seekToSegment, setIsMuted } = player;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.code === "Space") {
        e.preventDefault();
        if (status === "playing") pause();
        else if (status === "paused") resume();
        else play();
      } else if (e.code === "ArrowLeft" && currentSegmentIndex > 0) {
        e.preventDefault();
        seekToSegment(currentSegmentIndex - 1);
      } else if (e.code === "ArrowRight" && currentSegmentIndex < totalSegments - 1) {
        e.preventDefault();
        seekToSegment(currentSegmentIndex + 1);
      } else if (e.code === "KeyM") {
        e.preventDefault();
        setIsMuted(!isMuted);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSegmentIndex, isMuted, pause, play, resume, seekToSegment, setIsMuted, status, totalSegments]);

  const tabs = [
    { id: "whiteboard" as const, label: "Board", Icon: Monitor },
    { id: "outline" as const, label: `Chapters (${initialLesson.segments.length})`, Icon: Layers },
    { id: "tutor" as const, label: "Notes & Q&A", Icon: GraduationCap },
  ];

  return (
    <div className="desk-grid flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border bg-background/90 px-4 py-2.5 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="btn-interactive flex items-center gap-1.5 rounded-full border border-border bg-paper px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">topics</span>
          </Link>

          <span className="hidden h-4 w-px bg-border sm:block" />

          <span className="handwritten hidden truncate text-xl leading-none md:block">
            {initialLesson.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFocusMode((v) => !v)}
            title={isFocusMode ? "Show side panels" : "Expand the board"}
            className={`btn-interactive flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs ${
              isFocusMode
                ? "border-electric bg-electric text-white"
                : "border-border bg-paper text-muted-foreground hover:text-foreground"
            }`}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isFocusMode ? "standard" : "focus"}</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="btn-interactive flex items-center gap-1.5 rounded-full border border-border bg-paper px-3 py-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-3.5 w-3.5 text-electric" />
            <span className="hidden sm:inline">settings</span>
          </button>
        </div>
      </header>

      {/* Honest provenance: a template outline is never shown as a real lesson. */}
      {source === "fallback" && (
        <div className="flex items-start gap-2.5 border-b border-[#d97706]/30 bg-sticky-yellow/60 px-4 py-2.5 sm:px-6">
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#92400e]" />
          <p className="text-[13px] leading-snug text-[#6b3f06]">
            <strong className="font-semibold">This is a generic outline, not a generated lesson.</strong>{" "}
            The AI tutor could not be reached, so the studio built a structural placeholder.
            Add your own NVIDIA key in settings, or retry in a moment.
          </p>
        </div>
      )}

      {player.errorMessage && (
        <div className="border-b border-border bg-paper px-4 py-2 text-[13px] text-muted-foreground sm:px-6">
          {player.errorMessage}
        </div>
      )}

      {/* Mobile section tabs */}
      <div className="sticky top-[49px] z-30 flex gap-2 border-b border-border bg-paper px-3 py-2 lg:hidden">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setMobileTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 font-mono text-[11px] transition-colors ${
              mobileTab === id ? "bg-electric text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <main className="mx-auto grid w-full max-w-[1760px] flex-1 grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-12 lg:p-5">
        {!isFocusMode && (
          <section
            className={`h-[520px] lg:col-span-3 lg:h-[calc(100vh-130px)] ${
              mobileTab === "outline" ? "block" : "hidden lg:block"
            }`}
          >
            <LessonOutline
              lesson={initialLesson}
              currentSegmentIndex={currentSegmentIndex}
              status={status}
              onSelectSegment={seekToSegment}
            />
          </section>
        )}

        <section
          className={`flex h-[calc(100vh-130px)] min-h-[540px] flex-col gap-3.5 transition-all duration-300 ${
            isFocusMode ? "mx-auto w-full max-w-6xl lg:col-span-12" : "lg:col-span-6"
          } ${mobileTab === "whiteboard" ? "flex" : "hidden lg:flex"}`}
        >
          <div className="min-h-0 flex-1">
            <Whiteboard
              actions={player.whiteboard.actions}
              status={status}
              currentSegmentHeading={player.currentSegment?.heading}
              currentSegmentNarration={player.currentSegment?.narration}
              narrationProgress={player.speech.progress}
              zoom={player.whiteboard.zoom}
              showGrid={player.whiteboard.showGrid}
              onZoomIn={() => player.whiteboard.setZoom((z) => Math.min(1.5, z + 0.15))}
              onZoomOut={() => player.whiteboard.setZoom((z) => Math.max(0.75, z - 0.15))}
              onResetZoom={player.whiteboard.resetZoom}
              onToggleGrid={() => player.whiteboard.setShowGrid((g) => !g)}
            />
          </div>

          <PlaybackControls
            status={status}
            currentSegmentIndex={currentSegmentIndex}
            totalSegments={totalSegments}
            segments={initialLesson.segments}
            speed={player.speed}
            isMuted={isMuted}
            onPlay={play}
            onPause={pause}
            onResume={resume}
            onRestart={player.restart}
            onSeek={seekToSegment}
            onSetSpeed={player.setSpeed}
            onToggleMute={() => setIsMuted(!isMuted)}
          />
        </section>

        {!isFocusMode && (
          <section
            className={`h-[520px] lg:col-span-3 lg:h-[calc(100vh-130px)] ${
              mobileTab === "tutor" ? "block" : "hidden lg:block"
            }`}
          >
            <TutorPanel
              lesson={initialLesson}
              currentSegment={player.currentSegment}
              currentSegmentIndex={currentSegmentIndex}
              status={status}
              apiKey={apiKey}
              model={selectedModel}
            />
          </section>
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        selectedModel={selectedModel}
        onSaveModel={handleSaveModel}
        voices={player.speech.availableVoices}
        selectedVoice={player.speech.selectedVoice}
        onSelectVoice={player.speech.setSelectedVoice}
        onPreviewVoice={player.speech.previewVoice}
      />
    </div>
  );
};
