"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { WhiteboardAction } from "@/lib/schemas/lesson-schema";
import { WhiteboardActionRenderer } from "@/lib/whiteboard/action-renderer";
import { PlaybackStatus } from "@/types/lesson";
import { AITeacherAvatar } from "./AITeacherAvatar";
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
  HelpCircle,
  Moon,
  Sun,
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
  currentSegmentNarration?: string;
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
  currentSegmentNarration,
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
  const [penColor, setPenColor] = useState<string>("#1677ff");
  const [canvasTheme, setCanvasTheme] = useState<"porcelain" | "blueprint">("porcelain");

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



  // Convert client mouse coordinates to SVG 1000x600 viewBox coordinates
  const getSvgPoint = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!svgRef.current) return null;
    const pt = svgRef.current.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return null;
    const svgPoint = pt.matrixTransform(ctm.inverse());
    return { x: svgPoint.x, y: svgPoint.y };
  };

  // Mouse handlers for Drawing & Panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === "pan") {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    if (activeTool === "pen" || activeTool === "highlighter") {
      const pt = getSvgPoint(e.clientX, e.clientY);
      if (!pt) return;

      const newStroke: StudentStroke = {
        id: `stroke-${Date.now()}-${Math.random()}`,
        tool: activeTool,
        color: activeTool === "highlighter" ? "rgba(254, 240, 138, 0.55)" : penColor,
        width: activeTool === "highlighter" ? 18 : 3,
        points: [pt],
      };
      setCurrentStroke(newStroke);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isPanning && activeTool === "pan") {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (currentStroke && (activeTool === "pen" || activeTool === "highlighter")) {
      const pt = getSvgPoint(e.clientX, e.clientY);
      if (!pt) return;
      setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, pt] } : null));
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

  const handleUndo = () => {
    if (strokeHistory.length > 0) {
      const prev = strokeHistory[strokeHistory.length - 1];
      setStudentStrokes(prev);
      setStrokeHistory((h) => h.slice(0, -1));
    } else {
      setStudentStrokes([]);
    }
  };

  const handleClearStudentDrawings = () => {
    if (studentStrokes.length > 0) {
      setStrokeHistory((h) => [...h, studentStrokes]);
      setStudentStrokes([]);
    }
  };

  const handleResetAll = () => {
    setPanOffset({ x: 0, y: 0 });
    onResetZoom();
  };

  // Render SVG smooth path for student drawing
  const renderStrokePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col w-full h-full bg-white rounded-2xl border border-[#e4dfd3] shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 ${
        isFullscreen ? "p-4" : ""
      }`}
    >
      {/* Refined Minimalist Smartboard Header */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-[#ece8df] z-20">
        <div className="flex items-center space-x-2.5">
          <span className="w-2 h-2 rounded-full bg-[#1677ff] shadow-[0_0_8px_rgba(22,119,255,0.7)]" />
          <span className="text-[11px] font-mono tracking-widest text-[#121316] font-bold uppercase">
            Smartboard
          </span>

          {currentSegmentHeading && (
            <>
              <span className="text-neutral-300">•</span>
              <span className="text-xs font-serif italic text-neutral-700 truncate max-w-md font-medium">
                {currentSegmentHeading}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2 text-[10px] font-mono text-neutral-400">
          <span className="capitalize text-neutral-600 font-semibold">{status}</span>
          <span>•</span>
          <span>1000×600 VECTOR</span>
        </div>
      </div>

      {/* Main Whiteboard Canvas Surface */}
      <div className="relative flex-1 w-full h-full min-h-[460px] lg:min-h-[540px] flex items-center justify-center overflow-hidden p-3 select-none bg-[#faf8f5]">
        {/* The Porcelain White or Midnight Blueprint Smartboard Chassis */}
        <div
          className={`w-full h-full max-w-[1000px] max-h-[600px] rounded-xl overflow-hidden border transition-all duration-300 ease-out cursor-${
            activeTool === "pan" ? (isPanning ? "grabbing" : "grab") : activeTool === "pen" || activeTool === "highlighter" ? "crosshair" : "default"
          } ${
            canvasTheme === "blueprint"
              ? "blueprint-grid border-[#1e293b] shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
              : showGrid
              ? "smartboard-porcelain border-[#e2ddd3]"
              : "bg-white border-[#e2ddd3] shadow-[0_10px_35px_rgba(0,0,0,0.05)]"
          }`}
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
                <polygon points="0 0, 8 4, 0 8" fill="#1677ff" />
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
              {actions.map((action, actionIdx) => (
                <WhiteboardActionRenderer
                  key={(action as { id?: string }).id || Math.random().toString()}
                  action={action}
                  actionIndex={actionIdx}
                  isBlueprint={canvasTheme === "blueprint"}
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



            {/* Empty State */}
            {actions.length === 0 && (
              <g className="pointer-events-none">
                <text
                  x="500"
                  y="265"
                  fill="#1e293b"
                  fontSize="24"
                  textAnchor="middle"
                  fontFamily="Newsreader, Georgia, serif"
                  fontWeight="600"
                >
                  Interactive Digital Smartboard
                </text>
                <text
                  x="500"
                  y="300"
                  fill="#64748b"
                  fontSize="18"
                  textAnchor="middle"
                  fontFamily="Caveat, cursive"
                >
                  “Press Play to begin synchronized voice & whiteboard demonstration”
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Floating Concept Inspection Card (When Clicking Objects with Details) */}
        {inspectedAction && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 max-w-lg w-full px-4 z-30 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-4 rounded-2xl bg-white/95 border border-[#e2e5eb] text-[#0d0e11] shadow-[0_20px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl flex items-start justify-between space-x-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-electric/10 text-electric mt-0.5 shadow-xs">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-electric">
                    Concept Breakdown
                  </h4>
                  <p className="text-base font-serif font-bold text-[#0d0e11] mt-0.5">
                    {(inspectedAction as any).text || (inspectedAction as any).caption || (inspectedAction as any).label || "Diagram Component"}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed font-sans">
                    {(inspectedAction as any).details || (inspectedAction as any).tooltip || "This visual element represents a core component in the lesson flow."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedAction(null)}
                className="p-1 rounded-md text-neutral-400 hover:text-[#0d0e11] hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Floating AI Teacher Teaching Widget on Whiteboard */}
        <div className="absolute bottom-5 left-5 z-20">
          <AITeacherAvatar
            status={status}
            currentSegmentHeading={currentSegmentHeading}
            narration={currentSegmentNarration}
            teacherName="Dr. Maya Chen"
            isFloating={true}
          />
        </div>

        {/* Bespoke Floating Glass Smartboard Tool Dock */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white/95 border border-[#e4dfd3] shadow-[0_12px_36px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          {/* Tool selectors */}
          <button
            onClick={() => setActiveTool("pointer")}
            title="Inspect Element"
            className={`p-1.5 rounded-full text-xs transition-all ${
              activeTool === "pointer"
                ? "bg-[#1677ff] text-white shadow-xs"
                : "text-neutral-500 hover:text-[#121316] hover:bg-neutral-100"
            }`}
          >
            <MousePointer2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveTool("pan")}
            title="Pan Canvas"
            className={`p-1.5 rounded-full text-xs transition-all ${
              activeTool === "pan"
                ? "bg-[#1677ff] text-white shadow-xs"
                : "text-neutral-500 hover:text-[#121316] hover:bg-neutral-100"
            }`}
          >
            <Move className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setActiveTool("pen")}
            title="Student Notes Pen"
            className={`p-1.5 rounded-full text-xs transition-all ${
              activeTool === "pen"
                ? "bg-[#1677ff] text-white shadow-xs"
                : "text-neutral-500 hover:text-[#121316] hover:bg-neutral-100"
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>

          {activeTool === "pen" && (
            <div className="flex items-center space-x-1 px-1">
              {[
                { color: "#1677ff", title: "Blue" },
                { color: "#121316", title: "Carbon" },
                { color: "#dc2626", title: "Crimson" },
                { color: "#059669", title: "Emerald" },
              ].map((c) => (
                <button
                  key={c.color}
                  onClick={() => setPenColor(c.color)}
                  className={`w-3 h-3 rounded-full transition-transform ${
                    penColor === c.color ? "scale-125 ring-2 ring-blue-500" : "opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => setActiveTool("eraser")}
            title="Eraser"
            className={`p-1.5 rounded-full text-xs transition-all ${
              activeTool === "eraser"
                ? "bg-rose-500 text-white shadow-xs"
                : "text-neutral-500 hover:text-[#121316] hover:bg-neutral-100"
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          {studentStrokes.length > 0 && (
            <button
              onClick={handleClearStudentDrawings}
              title="Clear drawings"
              className="p-1.5 rounded-full text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          <div className="h-3 w-px bg-neutral-200 mx-1" />

          {/* Canvas Blueprint/Studio Mode Toggle */}
          <button
            onClick={() => setCanvasTheme((t) => (t === "porcelain" ? "blueprint" : "porcelain"))}
            title={canvasTheme === "blueprint" ? "Switch to Porcelain Studio" : "Switch to Midnight Blueprint"}
            className="p-1.5 rounded-full text-neutral-600 hover:text-[#121316] hover:bg-neutral-100"
          >
            {canvasTheme === "blueprint" ? <Moon className="w-3.5 h-3.5 text-[#38bdf8]" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          {/* Grid Toggle */}
          <button
            onClick={onToggleGrid}
            title={showGrid ? "Hide Grid" : "Show Grid"}
            className={`p-1.5 rounded-full ${
              showGrid ? "text-[#1677ff] bg-blue-50/60" : "text-neutral-400 hover:text-[#121316]"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <div className="h-3 w-px bg-neutral-200 mx-1" />

          {/* Zoom controls */}
          <button
            onClick={onZoomOut}
            disabled={zoom <= 0.75}
            className="p-1 rounded-full text-neutral-500 hover:text-[#121316] disabled:opacity-30"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="text-[10px] font-mono text-neutral-700 w-7 text-center font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            disabled={zoom >= 1.5}
            className="p-1 rounded-full text-neutral-500 hover:text-[#121316] disabled:opacity-30"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={handleResetAll}
            title="Reset Zoom"
            className="p-1 rounded-full text-neutral-400 hover:text-[#121316]"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <div className="h-3 w-px bg-neutral-200 mx-1" />

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            className="p-1.5 rounded-full text-neutral-500 hover:text-[#121316] hover:bg-neutral-100"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Resolution Badge Bottom Right */}
        <div className="absolute bottom-5 right-5 flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/95 border border-[#e2e5eb] text-[11px] font-mono text-neutral-600 backdrop-blur-md pointer-events-none shadow-md">
          <div
            className={`w-2 h-2 rounded-full ${
              status === "playing"
                ? "bg-electric shadow-[0_0_8px_rgba(22,119,255,0.8)]"
                : status === "paused"
                ? "bg-amber-400 shadow-[0_0_8px_rgba(255,170,0,0.8)]"
                : status === "completed"
                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                : "bg-neutral-400"
            }`}
          />
          <span className="capitalize font-semibold text-neutral-800">{status}</span>
          <span className="text-neutral-300">•</span>
          <span className="text-neutral-500 font-mono text-[10px]">1000×600 VECTOR</span>
        </div>
      </div>
    </div>
  );
};
