"use client";

import React from "react";
import { Lesson, PlaybackStatus } from "@/types/lesson";
import { CheckCircle2, Volume2, Clock, BookOpen, Layers } from "lucide-react";

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
    <div className="flex flex-col h-full bg-[#0a0e17] rounded-2xl border border-slate-800/80 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] font-mono text-sky-400 mb-2">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>~{lesson.estimatedDuration || 120}s LESSON ROADMAP</span>
          </div>
          <span className="text-slate-500">
            {currentSegmentIndex + 1} / {lesson.segments.length}
          </span>
        </div>
        <h2 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug">
          {lesson.title}
        </h2>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {lesson.summary}
        </p>
      </div>

      {/* Chapters Timeline List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase px-2 pb-1">
          Chapters & Diagrams ({lesson.segments.length})
        </div>

        {lesson.segments.map((segment, index) => {
          const isActive = index === currentSegmentIndex;
          const isPast = index < currentSegmentIndex;

          return (
            <button
              key={segment.id || index}
              onClick={() => onSelectSegment(index)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 border flex items-start space-x-3.5 group relative ${
                isActive
                  ? "bg-slate-900/90 border-sky-500/60 shadow-[0_0_20px_rgba(56,189,248,0.1)] ring-1 ring-sky-500/30"
                  : isPast
                  ? "bg-slate-950/40 border-slate-850 hover:bg-slate-900/50 hover:border-slate-800 text-slate-400"
                  : "bg-slate-950/20 border-transparent hover:bg-slate-900/30 hover:border-slate-850 text-slate-400"
              }`}
            >
              {/* Vertical connector line indicator */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-mono font-semibold transition-all ${
                  isActive
                    ? "bg-sky-500 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                    : isPast
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/40"
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
                    className={`text-xs font-semibold truncate ${
                      isActive ? "text-sky-300" : "text-slate-200 group-hover:text-white"
                    }`}
                  >
                    {segment.heading}
                  </span>
                  {isActive && status === "playing" && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {segment.narration}
                </p>

                {segment.visualActions && segment.visualActions.length > 0 && (
                  <div className="flex items-center space-x-1.5 mt-2 text-[10px] text-slate-500 font-mono">
                    <Layers className="w-3 h-3 text-indigo-400/70" />
                    <span>{segment.visualActions.length} whiteboard actions</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
