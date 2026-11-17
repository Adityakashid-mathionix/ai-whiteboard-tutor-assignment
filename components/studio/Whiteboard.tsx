"use client";

import React, { useRef, useState, useEffect } from "react";
import { WhiteboardAction } from "@/lib/schemas/lesson-schema";
import { WhiteboardActionRenderer } from "@/lib/whiteboard/action-renderer";
import { PlaybackStatus } from "@/types/lesson";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Maximize2,
  Minimize2,
  Radio,
  Sparkles,
  MousePointer2,
  Move,
} from "lucide-react";

interface WhiteboardProps {
  actions: WhiteboardAction[];
  status: PlaybackStatus;
  currentSegmentHeading?: string;
  zoom: number;
  showGrid: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleGrid: () => void;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  actions,
  status,
  currentSegmentHeading,
  zoom,
  showGrid,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleGrid,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTool, setActiveTool] = useState<"pointer" | "pan">("pointer");
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Compute laser pointer focus on the most recent action
  useEffect(() => {
    if (status !== "playing" || actions.length === 0) {
      setLaserPos(null);
      return;
    }

    const lastAction = actions[actions.length - 1];
    if (lastAction) {
      if ("x" in lastAction && "y" in lastAction) {
        setLaserPos({ x: (lastAction as any).x + 10, y: (lastAction as any).y + 10 });
      } else if ("cx" in lastAction && "cy" in lastAction) {
        setLaserPos({ x: (lastAction as any).cx, y: (lastAction as any).cy });
      } else if ("x2" in lastAction && "y2" in lastAction) {
        setLaserPos({ x: (lastAction as any).x2, y: (lastAction as any).y2 });
      } else {
        setLaserPos(null);
      }
    }
  }, [actions, status]);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col w-full h-full bg-[#070b12] rounded-2xl border border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 ${
        isFullscreen ? "p-4" : ""
      }`}
    >
      {/* Studio Top Island Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/60 backdrop-blur-xl z-20">
        <div className="flex items-center space-x-3">
          {/* Canvas Indicator */}
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
            <span className="text-[11px] font-mono tracking-wider text-slate-300 font-semibold uppercase">
              STUDIO BOARD
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          {/* Current Chapter Pill */}
          {currentSegmentHeading && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-sky-300 font-medium max-w-sm truncate shadow-sm">
              <Sparkles className="w-3 h-3 text-sky-400 animate-pulse flex-shrink-0" />
              <span className="truncate">{currentSegmentHeading}</span>
            </div>
          )}
        </div>

        {/* Studio Tools & Zoom Controls */}
        <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/70 shadow-inner">
          <button
            onClick={() => setActiveTool("pointer")}
            title="Pointer Mode"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeTool === "pointer"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTool("pan")}
            title="Pan Mode"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeTool === "pan"
                ? "bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-slate-800 mx-0.5" />

          <button
            onClick={onToggleGrid}
            title={showGrid ? "Hide Grid Matrix" : "Show Grid Matrix"}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              showGrid
                ? "bg-slate-800 text-sky-400"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-slate-800 mx-0.5" />

          <button
            onClick={onZoomOut}
            title="Zoom Out"
            disabled={zoom <= 0.75}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-300 w-10 text-center font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            title="Zoom In"
            disabled={zoom >= 1.5}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            title="Reset Zoom"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <div className="h-3 w-px bg-slate-800 mx-0.5" />

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Whiteboard Canvas Surface */}
      <div
        className={`relative flex-1 w-full h-full min-h-[420px] lg:min-h-[500px] flex items-center justify-center overflow-hidden p-3 select-none ${
          showGrid ? "whiteboard-grid" : ""
        }`}
      >
        <div
          className="w-full h-full max-w-[1000px] max-h-[600px] flex items-center justify-center transition-transform duration-200 ease-out"
          style={{ transform: `scale(${zoom})` }}
        >
          <svg
            viewBox="0 0 1000 600"
            className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
            style={{ width: "100%", height: "100%", maxHeight: "600px" }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <marker
                id="arrowhead-blue"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill="#38bdf8" />
              </marker>
              <marker
                id="arrowhead-indigo"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill="#818cf8" />
              </marker>
              <marker
                id="arrowhead-emerald"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill="#34d399" />
              </marker>
            </defs>

            {/* Whiteboard Action Renderers */}
            {actions.map((action) => (
              <WhiteboardActionRenderer
                key={(action as { id?: string }).id || Math.random().toString()}
                action={action}
              />
            ))}

            {/* Real-time Laser Pointer following recent action */}
            {laserPos && (
              <g className="transition-all duration-300">
                <circle
                  cx={laserPos.x}
                  cy={laserPos.y}
                  r="6"
                  fill="#f43f5e"
                  className="animate-ping opacity-75"
                />
                <circle
                  cx={laserPos.x}
                  cy={laserPos.y}
                  r="3.5"
                  fill="#f43f5e"
                  filter="drop-shadow(0 0 6px #f43f5e)"
                />
              </g>
            )}

            {/* Empty State */}
            {actions.length === 0 && (
              <g>
                <text
                  x="500"
                  y="280"
                  fill="#334155"
                  fontSize="20"
                  textAnchor="middle"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="600"
                >
                  Interactive Studio Canvas
                </text>
                <text
                  x="500"
                  y="315"
                  fill="#475569"
                  fontSize="13"
                  textAnchor="middle"
                  fontFamily="system-ui"
                >
                  Press Play to begin synchronized voice & whiteboard demonstration
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Live Audio Oscilloscope Wave Indicator (When Speaking) */}
        {status === "playing" && (
          <div className="absolute bottom-4 left-4 flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-lg pointer-events-none">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-medium text-emerald-400">
              VOICE NARRATION SYNC
            </span>
            <div className="flex items-center space-x-0.5 ml-1">
              <span className="w-1 h-3 bg-emerald-400/80 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-4 bg-emerald-400/90 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-2 bg-emerald-400/70 rounded-full animate-bounce [animation-delay:300ms]" />
              <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:450ms]" />
            </div>
          </div>
        )}

        {/* Status Pill Bottom Right */}
        <div className="absolute bottom-4 right-4 flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono text-slate-300 backdrop-blur-md pointer-events-none shadow-lg">
          <div
            className={`w-2 h-2 rounded-full ${
              status === "playing"
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                : status === "paused"
                ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                : status === "completed"
                ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                : "bg-slate-500"
            }`}
          />
          <span className="capitalize font-medium">{status}</span>
        </div>
      </div>
    </div>
  );
};
