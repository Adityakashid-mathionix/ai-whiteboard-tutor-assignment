"use client";

import React from "react";
import { Lesson, PlaybackStatus } from "@/types/lesson";
import { CheckCircle2, Volume2, Clock, Image as ImageIcon, Sparkles } from "lucide-react";

interface LessonOutlineProps {
  lesson: Lesson;
  currentSegmentIndex: number;
  status: PlaybackStatus;
  onSelectSegment: (index: number) => void;
}

export const LessonOutline: React.FC<LessonOutlineProps> = ({
  lesson,
  currentSegmentIndex,
  status,
  onSelectSegment,
}) => {
  return (
    <div className="flex flex-col h-full bg-[#0d131f] rounded-2xl border border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.4)] overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center justify-between text-[11px] font-mono text-blue-400 mb-2">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>~{lesson.estimatedDuration || 120}s MASTERCLASS</span>
          </div>
          <span className="text-slate-400 font-semibold">
            {currentSegmentIndex + 1} / {lesson.segments.length}
          </span>
        </div>
        <h2 className="text-sm font-bold text-white line-clamp-2 leading-snug">
          {lesson.title}
        </h2>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {lesson.summary}
        </p>
      </div>

      {/* Chapters Timeline List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            Curriculum Roadmap ({lesson.segments.length})
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Click to Seek
          </span>
        </div>

        {lesson.segments.map((segment, index) => {
          const isActive = index === currentSegmentIndex;
          const isPast = index < currentSegmentIndex;
          const hasImage = segment.visualActions?.some((a) => a.type === "drawImage");

          return (
            <button
              key={segment.id || index}
              onClick={() => onSelectSegment(index)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 border flex items-start space-x-3.5 group relative ${
                isActive
                  ? "bg-slate-900 border-blue-500/70 shadow-[0_0_20px_rgba(37,99,235,0.15)] ring-1 ring-blue-500/40"
                  : isPast
                  ? "bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/50 hover:border-slate-700 text-slate-400"
                  : "bg-slate-950/20 border-transparent hover:bg-slate-900/40 hover:border-slate-800 text-slate-400"
              }`}
            >
              {/* Segment state badge */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-[0_0_12px_rgba(37,99,235,0.6)]"
                    : isPast
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                    : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isActive && status === "playing" ? (
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Chapter Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold truncate ${
                      isActive ? "text-blue-300" : "text-slate-200 group-hover:text-white"
                    }`}
                  >
                    {segment.heading}
                  </span>
                  {isActive && status === "playing" && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {segment.narration}
                </p>

                {/* Chapter Meta Tags */}
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-[10px] font-mono text-slate-500">
                    {segment.visualActions?.length || 0} visual steps
                  </span>

                  {hasImage && (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-blue-950/60 text-blue-400 border border-blue-800/40">
                      <ImageIcon className="w-2.5 h-2.5" />
                      <span>DIAGRAM</span>
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
