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
    <div className="flex flex-col h-full bg-[#0d131f] rounded-2xl border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.4)] overflow-hidden">
      {/* Instructor Profile & Tab Switch */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-950 ${
                status === "playing"
                  ? "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)] animate-pulse"
                  : status === "paused"
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              }`}
            />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold text-white tracking-tight">Dr. Maya Chen</h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/50">
                AI FELLOW
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-slate-400">
              {status === "playing" ? (
                <span className="text-blue-400 font-medium flex items-center space-x-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>Explaining Segment {currentSegmentIndex + 1}</span>
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
        <div className="flex bg-slate-900 p-0.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === "notes"
                ? "bg-blue-600 text-white shadow-sm"
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
                ? "bg-blue-600 text-white shadow-sm"
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
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 shadow-inner">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-blue-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Chapter {currentSegmentIndex + 1}: {currentSegment?.heading}
                </span>
              </div>
              <div className="relative pl-3 border-l-2 border-blue-500/50 my-2">
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {currentSegment?.narration}
                </p>
              </div>
            </div>

            {/* Key Takeaway Card */}
            {currentSegment?.keyTakeaway && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 via-amber-950/10 to-transparent border border-amber-500/30 shadow-sm">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-300 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  <span className="uppercase tracking-wider text-[10px]">
                    Key Concept Takeaway
                  </span>
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
                  {currentSegment.keyTakeaway}
                </p>
              </div>
            )}

            {/* Interactive Smartboard Tips */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
              <div className="flex items-center space-x-1.5 text-slate-300 font-medium mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Interactive Whiteboard Controls</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Click any diagram element to inspect its concept breakdown. Use the Student Pen and Highlighter to take notes directly on the board.
              </p>
            </div>

            {/* Switch to Q&A Prompt Button */}
            <div className="pt-1">
              <button
                onClick={() => setActiveTab("chat")}
                className="w-full py-2.5 px-3.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-xs text-blue-300 hover:text-white transition-all flex items-center justify-center space-x-2 shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
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
