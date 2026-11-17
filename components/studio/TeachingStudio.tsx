"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Lesson } from "@/types/lesson";
import { useLessonPlayer } from "@/hooks/useLessonPlayer";
import { Whiteboard } from "./Whiteboard";
import { LessonOutline } from "./LessonOutline";
import { TutorPanel } from "./TutorPanel";
import { PlaybackControls } from "./PlaybackControls";
import { SettingsModal } from "./SettingsModal";
import confetti from "canvas-confetti";
import {
  Sparkles,
  ArrowLeft,
  Settings,
  Layers,
  GraduationCap,
  Monitor,
  Command,
  Maximize2,
} from "lucide-react";

interface TeachingStudioProps {
  initialLesson: Lesson;
}

export const TeachingStudio: React.FC<TeachingStudioProps> = ({ initialLesson }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("nvidia/nemotron-3.5-lightning-30b-a3b");
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<"whiteboard" | "outline" | "tutor">("whiteboard");

  useEffect(() => {
    try {
      const storedKey = localStorage.getItem("braynix_nvidia_key");
      const storedModel = localStorage.getItem("braynix_nvidia_model");
      if (storedKey) setApiKey(storedKey);
      if (storedModel) setSelectedModel(storedModel);
    } catch {}
  }, []);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    try {
      localStorage.setItem("braynix_nvidia_key", newKey);
    } catch {}
  };

  const handleSaveModel = (newModel: string) => {
    setSelectedModel(newModel);
    try {
      localStorage.setItem("braynix_nvidia_model", newModel);
    } catch {}
  };

  const onLessonComplete = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.6 },
        colors: ["#1677ff", "#00d2ff", "#00b875", "#ffaa00"],
      });
    } catch {}
  };

  const player = useLessonPlayer({
    lesson: initialLesson,
    onLessonComplete,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (player.status === "playing") player.pause();
        else if (player.status === "paused") player.resume();
        else player.play();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        if (player.currentSegmentIndex > 0) {
          player.seekToSegment(player.currentSegmentIndex - 1);
        }
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        if (player.currentSegmentIndex < player.totalSegments - 1) {
          player.seekToSegment(player.currentSegmentIndex + 1);
        }
      } else if (e.code === "KeyM") {
        e.preventDefault();
        player.setIsMuted(!player.isMuted);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [player]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fb] text-[#0d0e11] selection:bg-[#1677ff]/15 selection:text-[#1677ff] editorial-desk-grid">
      {/* Studio Top Navigation Bar */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white/95 border-b border-[#e5e7eb] backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs font-mono text-neutral-600 hover:text-[#0d0e11] px-3 py-1.5 rounded-full hover:bg-neutral-100 border border-neutral-200 transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Topics</span>
          </Link>

          <div className="h-4 w-px bg-neutral-200" />

          <div className="flex items-center space-x-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-electric/10 font-mono text-xs font-bold text-electric ring-1 ring-electric/30 shadow-xs">
              BX
            </div>
            <div>
              <span className="text-xs font-bold tracking-tight text-[#0d0e11] block leading-none font-sans">
                Braynix Studio
              </span>
              <span className="text-[10px] text-neutral-500 font-mono leading-none">
                Interactive Smartboard
              </span>
            </div>
          </div>
        </div>

        {/* Current Topic Badge */}
        <div className="hidden md:flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white border border-[#e2e5eb] text-xs shadow-xs">
          <span className="w-2 h-2 rounded-full bg-electric animate-pulse" />
          <span className="text-neutral-800 font-semibold font-serif italic truncate max-w-sm text-sm">
            {initialLesson.title}
          </span>
        </div>

        {/* Studio Actions */}
        <div className="flex items-center space-x-2">
          {/* Keyboard shortcut hint */}
          <div className="hidden lg:flex items-center space-x-1 text-[11px] font-mono text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200">
            <Command className="w-3 h-3 text-neutral-400" />
            <span>Space: Play/Pause</span>
          </div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-neutral-50 text-xs font-mono text-neutral-700 hover:text-[#0d0e11] border border-neutral-200 transition-all shadow-xs active:scale-95"
          >
            <Settings className="w-3.5 h-3.5 text-electric" />
            <span className="hidden sm:inline font-medium">Settings</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Navigation Bar */}
      <div className="lg:hidden flex border-b border-[#e5e7eb] bg-white px-3 py-2 space-x-2 shadow-xs sticky top-[57px] z-30">
        <button
          onClick={() => setMobileTab("whiteboard")}
          className={`flex-1 py-2 rounded-xl text-xs font-mono flex items-center justify-center space-x-1.5 transition-all duration-200 ${
            mobileTab === "whiteboard"
              ? "bg-electric text-white shadow-sm font-semibold"
              : "text-neutral-600 hover:text-[#0d0e11] bg-neutral-50"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Smartboard</span>
        </button>
        <button
          onClick={() => setMobileTab("outline")}
          className={`flex-1 py-2 rounded-xl text-xs font-mono flex items-center justify-center space-x-1.5 transition-all duration-200 ${
            mobileTab === "outline"
              ? "bg-electric text-white shadow-sm font-semibold"
              : "text-neutral-600 hover:text-[#0d0e11] bg-neutral-50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Chapters ({initialLesson.segments.length})</span>
        </button>
        <button
          onClick={() => setMobileTab("tutor")}
          className={`flex-1 py-2 rounded-xl text-xs font-mono flex items-center justify-center space-x-1.5 transition-all duration-200 ${
            mobileTab === "tutor"
              ? "bg-electric text-white shadow-sm font-semibold"
              : "text-neutral-600 hover:text-[#0d0e11] bg-neutral-50"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Notes & Q&A</span>
        </button>
      </div>

      {/* 3-Column Responsive Teaching Studio Layout */}
      <main className="flex-1 p-3 sm:p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1780px] mx-auto w-full">
        {/* LEFT COLUMN: Lesson Outline (3 cols on desktop) */}
        <section
          className={`lg:col-span-3 h-[520px] lg:h-[calc(100vh-130px)] ${
            mobileTab === "outline" ? "block" : "hidden lg:block"
          }`}
        >
          <LessonOutline
            lesson={initialLesson}
            currentSegmentIndex={player.currentSegmentIndex}
            status={player.status}
            onSelectSegment={(idx) => player.seekToSegment(idx)}
          />
        </section>

        {/* CENTER COLUMN: Whiteboard & Playback Controls (6 cols on desktop) */}
        <section
          className={`lg:col-span-6 flex flex-col space-y-3.5 h-[calc(100vh-130px)] min-h-[540px] ${
            mobileTab === "whiteboard" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Main Whiteboard Canvas */}
          <div className="flex-1 min-h-0">
            <Whiteboard
              actions={player.whiteboard.actions}
              status={player.status}
              currentSegmentHeading={player.currentSegment?.heading}
              zoom={player.whiteboard.zoom}
              showGrid={player.whiteboard.showGrid}
              onZoomIn={() =>
                player.whiteboard.setZoom((z) => Math.min(1.5, z + 0.15))
              }
              onZoomOut={() =>
                player.whiteboard.setZoom((z) => Math.max(0.75, z - 0.15))
              }
              onResetZoom={() => player.whiteboard.resetZoom()}
              onToggleGrid={() =>
                player.whiteboard.setShowGrid((g) => !g)
              }
            />
          </div>

          {/* Bottom Playback Controls */}
          <PlaybackControls
            status={player.status}
            currentSegmentIndex={player.currentSegmentIndex}
            totalSegments={player.totalSegments}
            segments={initialLesson.segments}
            speed={player.speed}
            isMuted={player.isMuted}
            onPlay={player.play}
            onPause={player.pause}
            onResume={player.resume}
            onRestart={player.restart}
            onSeek={player.seekToSegment}
            onSetSpeed={player.setSpeed}
            onToggleMute={() => player.setIsMuted(!player.isMuted)}
          />
        </section>

        {/* RIGHT COLUMN: AI Tutor Panel & Q&A (3 cols on desktop) */}
        <section
          className={`lg:col-span-3 h-[520px] lg:h-[calc(100vh-130px)] ${
            mobileTab === "tutor" ? "block" : "hidden lg:block"
          }`}
        >
          <TutorPanel
            lesson={initialLesson}
            currentSegment={player.currentSegment}
            currentSegmentIndex={player.currentSegmentIndex}
            status={player.status}
            apiKey={apiKey}
            model={selectedModel}
          />
        </section>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        selectedModel={selectedModel}
        onSaveModel={handleSaveModel}
      />
    </div>
  );
};
