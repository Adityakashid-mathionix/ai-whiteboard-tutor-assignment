"use client";

import React from "react";
import { Lesson, PlaybackStatus } from "@/types/lesson";
import { CheckCircle2, Volume2, Clock, Image as ImageIcon } from "lucide-react";

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
    <div className="flex flex-col h-full bg-[#10121a] rounded-2xl border border-[#222533] shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-[#222533] bg-[#141722]">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#00d2ff] mb-2">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>~{lesson.estimatedDuration || 120}s MASTERCLASS</span>
          </div>
          <span className="text-neutral-400 font-bold font-mono">
            {currentSegmentIndex + 1} / {lesson.segments.length}
          </span>
        </div>
        <h2 className="text-sm font-bold text-white line-clamp-2 leading-snug">
          {lesson.title}
        </h2>
        <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
          {lesson.summary}
        </p>
      </div>

      {/* Chapters Timeline List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-[10px] font-mono font-bold tracking-wider text-neutral-400 uppercase">
            Curriculum Roadmap ({lesson.segments.length})
          </span>
          <span className="text-[10px] font-mono text-neutral-500">
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
                  ? "bg-[#181c2b] border-[#0066ff] shadow-[0_0_20px_rgba(0,102,255,0.2)] ring-1 ring-[#0066ff]/50"
                  : isPast
                  ? "bg-[#0b0d13] border-[#1e212d] hover:bg-[#131620] hover:border-[#2b3042] text-neutral-400"
                  : "bg-transparent border-transparent hover:bg-[#131620] hover:border-[#222533] text-neutral-400"
              }`}
            >
              {/* Segment state badge */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold transition-all ${
                  isActive
                    ? "bg-[#0066ff] text-white shadow-[0_0_12px_rgba(0,102,255,0.7)]"
                    : isPast
                    ? "bg-[#003822] text-[#00d084] border border-[#005c38]"
                    : "bg-[#1e212d] text-neutral-400 group-hover:bg-[#282d3d]"
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isActive && status === "playing" ? (
                  <Volume2 className="w-3.5 h-3.5 animate-pulse text-white" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Chapter Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold truncate ${
                      isActive ? "text-[#00d2ff]" : "text-neutral-200 group-hover:text-white"
                    }`}
                  >
                    {segment.heading}
                  </span>
                  {isActive && status === "playing" && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00d2ff] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0066ff]" />
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {segment.narration}
                </p>

                {/* Chapter Meta Tags */}
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-[10px] font-mono text-neutral-500">
                    {segment.visualActions?.length || 0} visual vectors
                  </span>

                  {hasImage && (
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-[#0f243c] text-[#00d2ff] border border-[#1b3d63]">
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
