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
    <div className="flex flex-col h-full bg-[#10121a] rounded-2xl border border-[#222533] shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Instructor Profile & Tab Switch */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222533] bg-[#141722]">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066ff] to-[#00d2ff] flex items-center justify-center text-white shadow-[0_0_15px_rgba(0,102,255,0.4)]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#10121a] ${
                status === "playing"
                  ? "bg-[#00d2ff] shadow-[0_0_6px_rgba(0,210,255,0.8)] animate-pulse"
                  : status === "paused"
                  ? "bg-[#ffaa00]"
                  : "bg-[#00d084]"
              }`}
            />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-xs font-bold text-white tracking-tight">Dr. Maya Chen</h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#0f243c] text-[#00d2ff] border border-[#1b3d63]">
                AI FELLOW
              </span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-neutral-400">
              {status === "playing" ? (
                <span className="text-[#00d2ff] font-medium flex items-center space-x-1">
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
        <div className="flex bg-[#1a1d2c] p-0.5 rounded-xl border border-[#262a3a]">
          <button
            onClick={() => setActiveTab("notes")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === "notes"
                ? "bg-[#0066ff] text-white shadow-sm font-semibold"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Notes</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              activeTab === "chat"
                ? "bg-[#0066ff] text-white shadow-sm font-semibold"
                : "text-neutral-400 hover:text-neutral-200"
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
            <div className="p-4 rounded-xl bg-[#0b0d13] border border-[#222533] shadow-inner">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#00d2ff] mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Chapter {currentSegmentIndex + 1}: {currentSegment?.heading}
                </span>
              </div>
              <div className="relative pl-3 border-l-2 border-[#0066ff] my-2">
                <p className="text-xs text-neutral-200 leading-relaxed font-sans">
                  {currentSegment?.narration}
                </p>
              </div>
            </div>

            {/* Key Takeaway Card */}
            {currentSegment?.keyTakeaway && (
              <div className="p-4 rounded-xl bg-[#211a08] border border-[#6b4700] shadow-sm">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#ffaa00] mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#ffaa00]" />
                  <span className="uppercase tracking-wider text-[10px] font-mono">
                    Key Concept Takeaway
                  </span>
                </div>
                <p className="text-xs text-[#ffd280] leading-relaxed font-medium">
                  {currentSegment.keyTakeaway}
                </p>
              </div>
            )}

            {/* Interactive Smartboard Tips */}
            <div className="p-3.5 rounded-xl bg-[#141722] border border-[#222533] text-xs text-neutral-400">
              <div className="flex items-center space-x-1.5 text-neutral-300 font-medium mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#00d2ff]" />
                <span>Smartboard Interactivity</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Click any visual diagram or label to open a concept breakdown. Use the stylus pen and highlighter to annotate notes on the smartboard.
              </p>
            </div>

            {/* Switch to Q&A Prompt Button */}
            <div className="pt-1">
              <button
                onClick={() => setActiveTab("chat")}
                className="w-full py-2.5 px-3.5 rounded-xl bg-[#0066ff]/10 hover:bg-[#0066ff]/20 border border-[#0066ff]/30 text-xs text-[#00d2ff] hover:text-white transition-all flex items-center justify-center space-x-2 shadow-sm font-medium"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#00d2ff]" />
                <span>Ask Dr. Maya a follow-up question</span>
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
