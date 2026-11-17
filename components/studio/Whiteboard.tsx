"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
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
  PenTool,
  Highlighter,
  Eraser,
  Undo2,
  Trash2,
  Info,
  X,
  Crosshair,
  Layers,
} from "lucide-react";

interface StudentStroke {
  id: string;
  tool: "pen" | "highlighter";
  color: string;
  width: number;
  points: { x: number; y: number }[];
}

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
  const svgRef = useRef<SVGSVGElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTool, setActiveTool] = useState<"pointer" | "pan" | "pen" | "highlighter" | "eraser">("pointer");
  const [penColor, setPenColor] = useState<string>("#0066ff");
  const [laserPos, setLaserPos] = useState<{ x: number; y: number } | null>(null);
  const [showLaser, setShowLaser] = useState(true);

  // Pan state
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Student Annotation Layer
  const [studentStrokes, setStudentStrokes] = useState<StudentStroke[]>([]);
  const [strokeHistory, setStrokeHistory] = useState<StudentStroke[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<StudentStroke | null>(null);

  // Interactive Inspection Tooltip / Card
  const [inspectedAction, setInspectedAction] = useState<WhiteboardAction | null>(null);

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
    if (status !== "playing" || actions.length === 0 || !showLaser) {
      setLaserPos(null);
      return;
    }

    const lastAction = actions[actions.length - 1];
    if (lastAction) {
      if ("x" in lastAction && "y" in lastAction) {
        setLaserPos({ x: (lastAction as any).x + 12, y: (lastAction as any).y + 8 });
      } else if ("cx" in lastAction && "cy" in lastAction) {
        setLaserPos({ x: (lastAction as any).cx, y: (lastAction as any).cy });
      } else if ("x2" in lastAction && "y2" in lastAction) {
        setLaserPos({ x: (lastAction as any).x2, y: (lastAction as any).y2 });
      } else {
        setLaserPos(null);
      }
    }
  }, [actions, status, showLaser]);

  // Convert client mouse event to SVG viewBox (1000 x 600) coordinates
  const getSvgCoordinates = useCallback((e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
    return {
      x: Math.max(0, Math.min(1000, Math.round(svgP.x))),
      y: Math.max(0, Math.min(600, Math.round(svgP.y))),
    };
  }, []);

  // Mouse handlers for Panning and Student Drawing
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === "pan" || e.button === 1 || e.altKey) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    if (activeTool === "pen" || activeTool === "highlighter") {
      const coords = getSvgCoordinates(e);
      if (!coords) return;

      const newStroke: StudentStroke = {
        id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tool: activeTool,
        color: activeTool === "highlighter" ? "rgba(255, 215, 0, 0.4)" : penColor,
        width: activeTool === "highlighter" ? 18 : 3.5,
        points: [coords],
      };
      setCurrentStroke(newStroke);
    } else if (activeTool === "eraser") {
      const coords = getSvgCoordinates(e);
      if (!coords) return;
      eraseNearbyStrokes(coords.x, coords.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (currentStroke && (activeTool === "pen" || activeTool === "highlighter")) {
      const coords = getSvgCoordinates(e);
      if (!coords) return;
      setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, coords] } : null));
    } else if (activeTool === "eraser" && e.buttons === 1) {
      const coords = getSvgCoordinates(e);
      if (!coords) return;
      eraseNearbyStrokes(coords.x, coords.y);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (currentStroke) {
      setStrokeHistory((prev) => [...prev, studentStrokes]);
      setStudentStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  const eraseNearbyStrokes = (x: number, y: number) => {
    const radius = 25;
    setStudentStrokes((prev) =>
      prev.filter((stroke) => {
        const isNear = stroke.points.some(
          (pt) => Math.hypot(pt.x - x, pt.y - y) < radius
        );
        return !isNear;
      })
    );
  };

  const handleUndo = () => {
    if (strokeHistory.length === 0) return;
    const previous = strokeHistory[strokeHistory.length - 1];
    setStrokeHistory((prev) => prev.slice(0, -1));
    setStudentStrokes(previous);
  };

  const handleClearStudentDrawings = () => {
    if (studentStrokes.length > 0) {
      setStrokeHistory((prev) => [...prev, studentStrokes]);
      setStudentStrokes([]);
    }
  };

  const handleResetAll = () => {
    onResetZoom();
    setPanOffset({ x: 0, y: 0 });
  };

  const renderStrokePath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col w-full h-full bg-[#10121a] rounded-2xl border border-[#222533] shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 ${
        isFullscreen ? "p-4" : ""
      }`}
    >
      {/* Smartboard Hardware Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#141722] border-b border-[#222533] z-20 gap-2">
        {/* Left: Hardware Model & Chapter Tag */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0066ff] shadow-[0_0_8px_rgba(0,102,255,0.9)]" />
            <span className="text-[11px] font-mono tracking-widest text-neutral-200 font-bold uppercase">
              SMARTBOARD
            </span>
          </div>

          <div className="h-3.5 w-px bg-[#262a3a]" />

          {currentSegmentHeading && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#1a1d2c] border border-[#262a3a] text-xs text-[#00d2ff] font-medium max-w-sm truncate shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#00d2ff] flex-shrink-0" />
              <span className="truncate">{currentSegmentHeading}</span>
            </div>
          )}
        </div>

        {/* Center: Stylus & Student Tools Bar */}
        <div className="flex items-center space-x-1 bg-[#1a1d2c] p-1 rounded-xl border border-[#262a3a]">
          {/* Pointer Tool */}
          <button
            onClick={() => setActiveTool("pointer")}
            title="Inspect / Pointer Tool"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeTool === "pointer"
                ? "bg-[#0066ff] text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
          </button>

          {/* Pan Tool */}
          <button
            onClick={() => setActiveTool("pan")}
            title="Pan Canvas Mode"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeTool === "pan"
                ? "bg-[#0066ff] text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-[#262a3a] mx-0.5" />

          {/* Student Pen */}
          <button
            onClick={() => setActiveTool("pen")}
            title="Student Notes Pen"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeTool === "pen"
                ? "bg-[#0066ff] text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>

          {/* Pen Color Selector */}
          {activeTool === "pen" && (
            <div className="flex items-center space-x-1 px-1">
              {[
                { color: "#0066ff", title: "Cobalt Blue" },
                { color: "#090a0f", title: "Carbon Black" },
                { color: "#e62e4d", title: "Crimson" },
                { color: "#00b875", title: "Emerald" },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setPenColor(c.color)}
                  title={c.title}
                  className={`w-3 h-3 rounded-full transition-transform ${
                    penColor === c.color ? "scale-125 ring-1 ring-white" : "opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </div>
          )}

          {/* Student Highlighter */}
          <button
            onClick={() => setActiveTool("highlighter")}
            title="Highlighter Marker"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeTool === "highlighter"
                ? "bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>

          {/* Eraser */}
          <button
            onClick={() => setActiveTool("eraser")}
            title="Erase Student Drawings"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeTool === "eraser"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          {studentStrokes.length > 0 && (
            <>
              <button
                onClick={handleUndo}
                title="Undo stroke"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200"
              >
                <Undo2 className="w-3 h-3" />
              </button>
              <button
                onClick={handleClearStudentDrawings}
                title="Clear my annotations"
                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}

          <div className="h-3 w-px bg-[#262a3a] mx-0.5" />

          {/* Laser Pointer */}
          <button
            onClick={() => setShowLaser(!showLaser)}
            title={showLaser ? "Disable Teacher Laser" : "Enable Teacher Laser"}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              showLaser ? "text-rose-400 bg-rose-500/10" : "text-neutral-500"
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          {/* Grid Matrix */}
          <button
            onClick={onToggleGrid}
            title={showGrid ? "Hide Grid Matrix" : "Show Grid Matrix"}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              showGrid ? "bg-[#262a3a] text-[#00d2ff]" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-[#262a3a] mx-0.5" />

          {/* Zoom controls */}
          <button
            onClick={onZoomOut}
            title="Zoom Out"
            disabled={zoom <= 0.75}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 disabled:opacity-30"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-neutral-200 w-9 text-center font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            title="Zoom In"
            disabled={zoom >= 1.5}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 disabled:opacity-30"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetAll}
            title="Reset Zoom & Pan"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <div className="h-3 w-px bg-[#262a3a] mx-0.5" />

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Whiteboard Canvas Surface */}
      <div className="relative flex-1 w-full h-full min-h-[460px] lg:min-h-[540px] flex items-center justify-center overflow-hidden p-4 select-none bg-[#090a0f]">
        {/* The Porcelain White Smartboard Chassis */}
        <div
          className={`w-full h-full max-w-[1000px] max-h-[600px] rounded-xl overflow-hidden border-2 border-[#2b3042] transition-transform duration-100 ease-out cursor-${
            activeTool === "pan" ? (isPanning ? "grabbing" : "grab") : activeTool === "pen" || activeTool === "highlighter" ? "crosshair" : "default"
          } ${showGrid ? "smartboard-porcelain" : "bg-[#fcfdfe] shadow-[0_12px_45px_rgba(0,0,0,0.5)]"}`}
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 1000 600"
            className="w-full h-full"
            style={{ width: "100%", height: "100%", maxHeight: "600px" }}
            xmlns="http://www.w3.org/2000/svg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
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
                <polygon points="0 0, 8 4, 0 8" fill="#0066ff" />
              </marker>
              <marker
                id="arrowhead-sky"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill="#00a8e8" />
              </marker>
              <marker
                id="arrowhead-emerald"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill="#00b875" />
              </marker>
            </defs>

            {/* AI Teacher Whiteboard Layer */}
            <g id="teacher-layer">
              {actions.map((action) => (
                <WhiteboardActionRenderer
                  key={(action as { id?: string }).id || Math.random().toString()}
                  action={action}
                  onSelectAction={(act) => setInspectedAction(act)}
                  isSelected={Boolean(inspectedAction && "id" in inspectedAction && "id" in action && inspectedAction.id === action.id)}
                />
              ))}
            </g>

            {/* Student Freehand Annotation Layer */}
            <g id="student-layer">
              {studentStrokes.map((stroke) => (
                <path
                  key={stroke.id}
                  d={renderStrokePath(stroke.points)}
                  stroke={stroke.color}
                  strokeWidth={stroke.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}

              {currentStroke && (
                <path
                  d={renderStrokePath(currentStroke.points)}
                  stroke={currentStroke.color}
                  strokeWidth={currentStroke.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
            </g>

            {/* Real-time Teacher Laser Pointer */}
            {laserPos && showLaser && (
              <g className="transition-all duration-300 pointer-events-none">
                <circle
                  cx={laserPos.x}
                  cy={laserPos.y}
                  r="7"
                  fill="#ff3355"
                  className="animate-ping opacity-75"
                />
                <circle
                  cx={laserPos.x}
                  cy={laserPos.y}
                  r="4"
                  fill="#e62e4d"
                  filter="drop-shadow(0 0 8px #ff3355)"
                />
              </g>
            )}

            {/* Empty State */}
            {actions.length === 0 && (
              <g className="pointer-events-none">
                <text
                  x="500"
                  y="270"
                  fill="#2b3042"
                  fontSize="22"
                  textAnchor="middle"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="700"
                >
                  Interactive Digital Smartboard
                </text>
                <text
                  x="500"
                  y="308"
                  fill="#64748b"
                  fontSize="14"
                  textAnchor="middle"
                  fontFamily="system-ui"
                >
                  Press Play to begin synchronized voice & whiteboard demonstration
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Floating Concept Inspection Card (When Clicking Objects with Details) */}
        {inspectedAction && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 max-w-lg w-full px-4 z-30 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="p-4 rounded-xl bg-[#141722]/95 border border-[#0066ff]/50 text-neutral-100 shadow-2xl backdrop-blur-xl flex items-start justify-between space-x-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-[#0066ff]/20 text-[#00d2ff] mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-[#00d2ff]">
                    Concept Breakdown
                  </h4>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {(inspectedAction as any).text || (inspectedAction as any).caption || (inspectedAction as any).label || "Diagram Component"}
                  </p>
                  <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                    {(inspectedAction as any).details || (inspectedAction as any).tooltip || "This visual element represents a core component in the lesson flow."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedAction(null)}
                className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-[#1a1d2c] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Live Audio Oscilloscope Wave Indicator (When Speaking) */}
        {status === "playing" && (
          <div className="absolute bottom-5 left-5 flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#141722]/95 border border-[#262a3a] backdrop-blur-md shadow-lg pointer-events-none">
            <Radio className="w-3.5 h-3.5 text-[#00d2ff] animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-[#00d2ff]">
              VOICE NARRATION SYNC
            </span>
            <div className="flex items-center space-x-0.5 ml-1">
              <span className="w-1 h-3 bg-[#00d2ff] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-4 bg-[#00d2ff] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-2 bg-[#00d2ff] rounded-full animate-bounce [animation-delay:300ms]" />
              <span className="w-1 h-5 bg-[#00d2ff] rounded-full animate-bounce [animation-delay:450ms]" />
            </div>
          </div>
        )}

        {/* Resolution Badge Bottom Right */}
        <div className="absolute bottom-5 right-5 flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#141722]/95 border border-[#262a3a] text-[11px] font-mono text-neutral-300 backdrop-blur-md pointer-events-none shadow-lg">
          <div
            className={`w-2 h-2 rounded-full ${
              status === "playing"
                ? "bg-[#00d2ff] shadow-[0_0_8px_rgba(0,210,255,0.8)]"
                : status === "paused"
                ? "bg-[#ffaa00] shadow-[0_0_8px_rgba(255,170,0,0.8)]"
                : status === "completed"
                ? "bg-[#00b875] shadow-[0_0_8px_rgba(0,184,117,0.8)]"
                : "bg-neutral-500"
            }`}
          />
          <span className="capitalize font-semibold">{status}</span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-400 font-mono text-[10px]">1000×600 VECTOR</span>
        </div>
      </div>
    </div>
  );
};
