"use client";

import React, { useState } from "react";
import { Lesson, LessonSegment, PlaybackStatus } from "@/types/lesson";
import { FollowUpChat } from "@/components/followup/FollowUpChat";
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  MessageSquare,
  Lightbulb,
  Radio,
  HelpCircle,
} from "lucide-react";

interface TutorPanelProps {
  lesson: Lesson;
  currentSegment: LessonSegment | null;
  currentSegmentIndex: number;
  status: PlaybackStatus;
  apiKey?: string;
  model?: string;
}

export const TutorPanel: React.FC<TutorPanelProps> = ({
  lesson,
  currentSegment,
  currentSegmentIndex,
  status,
  apiKey,
  model,
}) => {
  const [activeTab, setActiveTab] = useState<"notes" | "chat">("notes");

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-[#e2e5eb] shadow-[0_4px_25px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Instructor Profile & Tab Switch */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f1f3f7] bg-white">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-electric/10 text-electric border border-electric/25 flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                status === "playing"
                  ? "bg-electric shadow-[0_0_6px_rgba(22,119,255,0.8)] animate-pulse"
                  : status === "paused"
                  ? "bg-amber-400"
                  : "bg-emerald-500"
              }`}
            />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold text-[#0d0e11] tracking-tight font-sans">Dr. Maya Chen</h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-electric/10 text-electric border border-electric/25 font-semibold">
                AI FELLOW
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-neutral-500 font-mono">
              {status === "playing" ? (
                <span className="text-electric font-medium flex items-center space-x-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>Explaining Chapter {currentSegmentIndex + 1}</span>
                </span>
              ) : status === "paused" ? (
                <span>Paused</span>
              ) : (
                <span>Interactive Teaching Mode</span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-neutral-100 p-0.5 rounded-full border border-neutral-200">
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1 text-xs font-mono rounded-full transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === "notes"
                ? "bg-electric text-white shadow-xs font-semibold scale-105"
                : "text-neutral-600 hover:text-[#0d0e11]"
            }`}
          >
            <BookOpen className="w-3 h-3" />
            <span>Notes</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1 text-xs font-mono rounded-full transition-all duration-200 flex items-center space-x-1.5 ${
              activeTab === "chat"
                ? "bg-electric text-white shadow-xs font-semibold scale-105"
                : "text-neutral-600 hover:text-[#0d0e11]"
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            <span>Ask Q&A</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Lecture Notes & Concepts */}
      {activeTab === "notes" ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Current Chapter Narration Script with handwritten tutor callout */}
          <div className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-electric">
                Chapter {currentSegmentIndex + 1} Spoken Script
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                Word-by-word Vector Sync
              </span>
            </div>
            <p className="text-xs text-[#0d0e11] leading-relaxed font-sans">
              {currentSegment?.narration || "Select a chapter or press Play to begin narration."}
            </p>

            {/* Handwritten note from Dr. Maya */}
            <div className="pt-2 border-t border-dashed border-neutral-300 flex items-start gap-2 text-amber-700">
              <span className="handwritten text-xl leading-none">“</span>
              <p className="handwritten text-lg leading-tight text-amber-800">
                Notice how the smartboard coordinates align with this exact explanation.
              </p>
            </div>
          </div>

          {/* Key Takeaways */}
          {(() => {
            const takeaways =
              (lesson.keyTakeaways && lesson.keyTakeaways.length > 0)
                ? lesson.keyTakeaways
                : lesson.segments.map((s) => s.keyTakeaway).filter(Boolean);

            if (!takeaways || takeaways.length === 0) return null;

            return (
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 px-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Core Concept Takeaways</span>
                </div>
                <div className="space-y-1.5">
                  {takeaways.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white border border-[#e2e5eb] flex items-start space-x-2.5 text-xs text-neutral-700 shadow-xs"
                    >
                      <span className="font-mono text-[10px] font-bold text-electric px-1.5 py-0.5 rounded-full bg-electric/10 border border-electric/20 flex-shrink-0">
                        0{idx + 1}
                      </span>
                      <span className="leading-relaxed font-sans">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Socratic Question Quick Prompt */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-electric/5 to-transparent border border-electric/20 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-electric">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="font-sans">Have a follow-up question?</span>
            </div>
            <p className="text-[11px] text-neutral-600 leading-relaxed font-sans">
              Switch to the Ask Q&A tab to query Dr. Maya Chen. She uses NVIDIA NIM with the complete curriculum context.
            </p>
            <button
              onClick={() => setActiveTab("chat")}
              className="w-full py-2 rounded-xl bg-electric hover:bg-[#0958d9] text-white text-xs font-mono font-semibold transition-all duration-200 shadow-xs active:scale-95"
            >
              Ask Dr. Maya a Question →
            </button>
          </div>
        </div>
      ) : (
        /* Tab 2: NVIDIA NIM Follow-Up Chat */
        <div className="flex-1 overflow-hidden p-3 flex flex-col">
          <FollowUpChat
            lesson={lesson}
            currentSegmentHeading={currentSegment?.heading}
            apiKey={apiKey}
            model={model}
          />
        </div>
      )}
    </div>
  );
};
