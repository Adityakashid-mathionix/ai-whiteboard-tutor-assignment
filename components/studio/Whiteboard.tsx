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
  Redo2,
  Trash2,
  Info,
  X,
  Crosshair,
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
  const [penColor, setPenColor] = useState<string>("#2563eb"); // default electric blue
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
        color: activeTool === "highlighter" ? "rgba(253, 224, 71, 0.45)" : penColor,
        width: activeTool === "highlighter" ? 18 : 3,
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

  // Convert points array to smooth SVG path string
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
      className={`relative flex flex-col w-full h-full bg-[#0b0f17] rounded-2xl border border-slate-800/90 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300 ${
        isFullscreen ? "p-4" : ""
      }`}
    >
      {/* Studio Top Island Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#0f172a]/95 border-b border-slate-800 backdrop-blur-xl z-20 gap-2">
        {/* Left: Indicator & Current Chapter */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
            <span className="text-[11px] font-mono tracking-wider text-slate-200 font-bold uppercase">
              SMARTBOARD
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          {currentSegmentHeading && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-blue-300 font-medium max-w-sm truncate shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="truncate">{currentSegmentHeading}</span>
            </div>
          )}
        </div>

        {/* Center: Student Drawing & Interaction Tools */}
        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTool("pointer")}
            title="Pointer / Select Object"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeTool === "pointer"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveTool("pan")}
            title="Pan Canvas Mode"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeTool === "pan"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-slate-800 mx-0.5" />

          {/* Student Pen */}
          <button
            onClick={() => setActiveTool("pen")}
            title="Student Notes Pen"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeTool === "pen"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>

          {/* Pen Color Dots (visible when pen active) */}
          {activeTool === "pen" && (
            <div className="flex items-center space-x-1 px-1">
              {[
                { color: "#2563eb", title: "Electric Blue" },
                { color: "#dc2626", title: "Crimson" },
                { color: "#059669", title: "Emerald" },
                { color: "#0f172a", title: "Charcoal" },
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
            title="Student Highlighter"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeTool === "highlighter"
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>

          {/* Eraser */}
          <button
            onClick={() => setActiveTool("eraser")}
            title="Erase Student Annotations"
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              activeTool === "eraser"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          {studentStrokes.length > 0 && (
            <>
              <button
                onClick={handleUndo}
                title="Undo student stroke"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
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

          <div className="h-3 w-px bg-slate-800 mx-0.5" />

          {/* Laser Pointer Toggle */}
          <button
            onClick={() => setShowLaser(!showLaser)}
            title={showLaser ? "Disable Teacher Laser" : "Enable Teacher Laser"}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              showLaser ? "text-rose-400 bg-rose-500/10" : "text-slate-500"
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          {/* Grid Toggle */}
          <button
            onClick={onToggleGrid}
            title={showGrid ? "Hide Grid Matrix" : "Show Grid Matrix"}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              showGrid ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-slate-800 mx-0.5" />

          {/* Zoom controls */}
          <button
            onClick={onZoomOut}
            title="Zoom Out"
            disabled={zoom <= 0.75}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-300 w-9 text-center font-semibold">
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
            onClick={handleResetAll}
            title="Reset Zoom & Pan"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <div className="h-3 w-px bg-slate-800 mx-0.5" />

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Whiteboard Canvas Surface */}
      <div
        className="relative flex-1 w-full h-full min-h-[460px] lg:min-h-[540px] flex items-center justify-center overflow-hidden p-3 select-none bg-[#090d14]"
      >
        {/* The Digital Whiteboard Slate: Crisp Clean White Surface */}
        <div
          className={`w-full h-full max-w-[1000px] max-h-[600px] rounded-xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.35)] border border-slate-700/80 transition-transform duration-100 ease-out cursor-${
            activeTool === "pan" ? (isPanning ? "grabbing" : "grab") : activeTool === "pen" || activeTool === "highlighter" ? "crosshair" : "default"
          } ${showGrid ? "whiteboard-canvas-light" : "bg-white"}`}
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
                <polygon points="0 0, 8 4, 0 8" fill="#2563eb" />
              </marker>
              <marker
                id="arrowhead-sky"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill="#0284c7" />
              </marker>
              <marker
                id="arrowhead-emerald"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon points="0 0, 8 4, 0 8" fill="#059669" />
              </marker>
            </defs>

            {/* AI Teacher Whiteboard Actions Layer */}
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

            {/* Student Freehand Annotation Layer (Completely Independent) */}
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
                  fill="#ef4444"
                  className="animate-ping opacity-75"
                />
                <circle
                  cx={laserPos.x}
                  cy={laserPos.y}
                  r="4"
                  fill="#dc2626"
                  filter="drop-shadow(0 0 8px #ef4444)"
                />
              </g>
            )}

            {/* Empty State */}
            {actions.length === 0 && (
              <g className="pointer-events-none">
                <text
                  x="500"
                  y="270"
                  fill="#475569"
                  fontSize="22"
                  textAnchor="middle"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="600"
                >
                  Interactive Smartboard Canvas
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
            <div className="p-4 rounded-xl bg-slate-900/95 border border-blue-500/40 text-slate-100 shadow-2xl backdrop-blur-xl flex items-start justify-between space-x-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-blue-400">
                    Concept Breakdown
                  </h4>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {(inspectedAction as any).text || (inspectedAction as any).caption || (inspectedAction as any).label || "Diagram Component"}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {(inspectedAction as any).details || (inspectedAction as any).tooltip || "This visual element represents a core component in the lesson flow."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedAction(null)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Live Audio Oscilloscope Wave Indicator (When Speaking) */}
        {status === "playing" && (
          <div className="absolute bottom-4 left-4 flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-lg pointer-events-none">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span className="text-[10px] font-mono font-semibold text-blue-400">
              VOICE NARRATION SYNC
            </span>
            <div className="flex items-center space-x-0.5 ml-1">
              <span className="w-1 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1 h-4 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
              <span className="w-1 h-5 bg-blue-400 rounded-full animate-bounce [animation-delay:450ms]" />
            </div>
          </div>
        )}

        {/* Status Pill Bottom Right */}
        <div className="absolute bottom-4 right-4 flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 backdrop-blur-md pointer-events-none shadow-lg">
          <div
            className={`w-2 h-2 rounded-full ${
              status === "playing"
                ? "bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]"
                : status === "paused"
                ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                : status === "completed"
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                : "bg-slate-500"
            }`}
          />
          <span className="capitalize font-medium">{status}</span>
        </div>
      </div>
    </div>
  );
};
