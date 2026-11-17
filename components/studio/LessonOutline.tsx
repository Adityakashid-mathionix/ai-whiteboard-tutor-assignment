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
    <div className="flex flex-col h-full bg-paper rounded-2xl border border-border shadow-[0_4px_25px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-border bg-paper">
        <div className="flex items-center justify-between text-[11px] font-mono text-electric mb-2">
          <div className="flex items-center space-x-1.5 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>~{lesson.estimatedDuration || 120}s MASTERCLASS</span>
          </div>
          <span className="text-muted-foreground font-bold font-mono">
            {currentSegmentIndex + 1} / {lesson.segments.length}
          </span>
        </div>
        <h2 className="text-base handwritten font-bold text-foreground line-clamp-2 leading-snug">
          {lesson.title}
        </h2>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-sans">
          {lesson.summary}
        </p>
      </div>

      {/* Chapters Timeline List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-[10px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
            Curriculum Roadmap ({lesson.segments.length})
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
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
              className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 border flex items-start space-x-3 group relative ${
                isActive
                  ? "bg-electric/5 border-electric shadow-paper ring-1 ring-electric/30"
                  : isPast
                  ? "bg-muted/70 border-border hover:bg-muted/70 hover:border-neutral-300 text-muted-foreground"
                  : "bg-transparent border-transparent hover:bg-muted hover:border-border text-muted-foreground"
              }`}
            >
              {/* Segment state badge */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-electric text-white shadow-paper scale-105"
                    : isPast
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-muted text-muted-foreground group-hover:bg-neutral-200"
                }`}
              >
                {isPast ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Title & Narration Preview */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-medium truncate ${
                      isActive ? "text-foreground font-semibold" : "text-foreground/80 group-hover:text-foreground"
                    }`}
                  >
                    {segment.heading}
                  </h4>
                  {hasImage && (
                    <span
                      title="Includes Educational Image"
                      className="ml-1 text-electric flex-shrink-0"
                    >
                      <ImageIcon className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 leading-snug">
                  {segment.narration}
                </p>

                {/* Live Speaking Indicator */}
                {isActive && status === "playing" && (
                  <div className="flex items-center space-x-1.5 mt-2 text-[10px] font-mono text-electric font-semibold">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    <span>Speaking now...</span>
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
