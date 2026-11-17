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
  Quote,
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
    <div className="flex flex-col h-full bg-[#0a0e17] rounded-2xl border border-slate-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl">
      {/* Instructor Profile & Tab Switch */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                status === "playing"
                  ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse"
                  : status === "paused"
                  ? "bg-amber-400"
                  : "bg-sky-400"
              }`}
            />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold text-white tracking-tight">AI Tutor</h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                PRO
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-slate-400">
              {status === "playing" ? (
                <span className="text-emerald-400 font-medium flex items-center space-x-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>Narrating Ch. {currentSegmentIndex + 1}</span>
                </span>
              ) : status === "paused" ? (
                <span>Paused</span>
              ) : (
                <span>Ready to Guide</span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-900/90 p-0.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === "notes"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Notes</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === "chat"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Q&A</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "notes" ? (
          <div className="space-y-4">
            {/* Live Narration Transcript */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 shadow-inner">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-sky-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Chapter {currentSegmentIndex + 1}: {currentSegment?.heading}
                </span>
              </div>
              <div className="relative pl-3 border-l-2 border-sky-500/50 my-2">
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {currentSegment?.narration}
                </p>
              </div>
            </div>

            {/* Key Takeaway Card */}
            {currentSegment?.keyTakeaway && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-950/20 to-transparent border border-amber-500/30 shadow-sm">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span className="uppercase tracking-wider text-[10px]">
                    Core Concept Takeaway
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
                  {currentSegment.keyTakeaway}
                </p>
              </div>
            )}

            {/* Switch to Q&A Prompt Button */}
            <div className="pt-1">
              <button
                onClick={() => setActiveTab("chat")}
                className="w-full py-2.5 px-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-center space-x-2 shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                <span>Ask tutor a follow-up question</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <FollowUpChat
              lesson={lesson}
              currentSegmentHeading={currentSegment?.heading}
              apiKey={apiKey}
              model={model}
            />
          </div>
        )}
      </div>
    </div>
  );
};
