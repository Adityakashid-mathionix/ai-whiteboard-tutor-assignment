"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
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
  MousePointer2,
  Move,
  PenTool,
  Highlighter,
  Eraser,
  Undo2,
  Trash2,
  Info,
  X,
  Moon,
  Sun,
} from "lucide-react";

type Tool = "pointer" | "pan" | "pen" | "highlighter" | "eraser";

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
  /** 0 → 1 through the current narration, used to reveal the drawing in step. */
  narrationProgress?: number;
  zoom: number;
  showGrid: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onToggleGrid: () => void;
}

const PEN_COLORS = [
  { color: "#1677ff", title: "Blue" },
  { color: "#1b1b1b", title: "Ink" },
  { color: "#dc2626", title: "Red" },
  { color: "#059669", title: "Green" },
];

/** Squared distance from point P to segment AB, in board units. */
function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return (px - cx) ** 2 + (py - cy) ** 2;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  actions,
  status,
  currentSegmentHeading,
  currentSegmentNarration,
  narrationProgress = 1,
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
  const [activeTool, setActiveTool] = useState<Tool>("pointer");
  const [penColor, setPenColor] = useState("#1677ff");
  const [canvasTheme, setCanvasTheme] = useState<"porcelain" | "blueprint">("porcelain");

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const [studentStrokes, setStudentStrokes] = useState<StudentStroke[]>([]);
  const [strokeHistory, setStrokeHistory] = useState<StudentStroke[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<StudentStroke | null>(null);

  const [inspectedAction, setInspectedAction] = useState<WhiteboardAction | null>(null);

  const isBlueprint = canvasTheme === "blueprint";

  /**
   * While narration plays, the board fills in as the words arrive rather than
   * appearing all at once. The first few elements (title, frame) are always
   * shown so the board is never blank mid-sentence.
   */
  const visibleCount = useMemo(() => {
    if (status !== "playing") return actions.length;
    const revealed = Math.ceil(narrationProgress * actions.length);
    return Math.max(Math.min(4, actions.length), Math.min(actions.length, revealed));
  }, [actions.length, narrationProgress, status]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /** Client pixels → the 1000×600 board coordinate space. */
  const getBoardPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;

    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;

    const ctm = svg.getScreenCTM();
    if (!ctm) return null;

    const mapped = point.matrixTransform(ctm.inverse());
    return { x: mapped.x, y: mapped.y };
  }, []);

  const eraseAt = useCallback((x: number, y: number) => {
    const radiusSq = 14 * 14;
    setStudentStrokes((prev) => {
      const kept = prev.filter(
        (stroke) =>
          !stroke.points.some((point, i) => {
            if (i === 0) return (point.x - x) ** 2 + (point.y - y) ** 2 <= radiusSq;
            const previous = stroke.points[i - 1];
            return distanceToSegment(x, y, previous.x, previous.y, point.x, point.y) <= radiusSq;
          })
      );

      if (kept.length === prev.length) return prev;
      setStrokeHistory((history) => [...history, prev]);
      return kept;
    });
  }, []);

  // Pointer events cover mouse, pen and touch with one code path.
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);

    if (activeTool === "pan") {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    const point = getBoardPoint(e.clientX, e.clientY);
    if (!point) return;

    if (activeTool === "eraser") {
      eraseAt(point.x, point.y);
      return;
    }

    if (activeTool === "pen" || activeTool === "highlighter") {
      setCurrentStroke({
        id: `stroke-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        tool: activeTool,
        color: activeTool === "highlighter" ? "rgba(254, 240, 138, 0.55)" : penColor,
        width: activeTool === "highlighter" ? 18 : 3,
        points: [point],
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isPanning && activeTool === "pan") {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (activeTool === "eraser" && e.buttons === 1) {
      const point = getBoardPoint(e.clientX, e.clientY);
      if (point) eraseAt(point.x, point.y);
      return;
    }

    if (!currentStroke) return;
    const point = getBoardPoint(e.clientX, e.clientY);
    if (!point) return;
    setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, point] } : null));
  };

  const handlePointerUp = () => {
    if (isPanning) setIsPanning(false);

    if (currentStroke) {
      setStrokeHistory((prev) => [...prev, studentStrokes]);
      setStudentStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  const handleUndo = () => {
    setStrokeHistory((history) => {
      if (history.length === 0) {
        setStudentStrokes([]);
        return history;
      }
      setStudentStrokes(history[history.length - 1]);
      return history.slice(0, -1);
    });
  };

  const handleClearDrawings = () => {
    if (studentStrokes.length === 0) return;
    setStrokeHistory((history) => [...history, studentStrokes]);
    setStudentStrokes([]);
  };

  const strokePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} l 0.1 0.1`;
    }
    return points.reduce(
      (d, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${d} L ${p.x} ${p.y}`),
      ""
    );
  };

  const cursor =
    activeTool === "pan"
      ? isPanning
        ? "grabbing"
        : "grab"
      : activeTool === "pointer"
      ? "default"
      : "crosshair";

  const toolButton = (tool: Tool, Icon: typeof PenTool, label: string) => (
    <button
      key={tool}
      onClick={() => setActiveTool(tool)}
      title={label}
      aria-label={label}
      aria-pressed={activeTool === tool}
      className={`rounded-full p-1.5 transition-colors ${
        activeTool === tool
          ? tool === "eraser"
            ? "bg-destructive text-white"
            : "bg-electric text-white"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border bg-paper shadow-board"
    >
      {/* Board header */}
      <div className="z-20 flex items-center justify-between border-b border-border bg-paper px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-2 w-2 flex-shrink-0 rounded-full bg-electric" />
          <span className="eyebrow">smartboard</span>
          {currentSegmentHeading && (
            <>
              <span className="text-border">•</span>
              <span className="handwritten truncate text-lg leading-none text-foreground">
                {currentSegmentHeading}
              </span>
            </>
          )}
        </div>
        <span className="hidden font-mono text-[10px] capitalize text-muted-foreground sm:block">
          {status}
        </span>
      </div>

      {/* Canvas */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-paper-sunk p-3">
        <div
          className={`h-full max-h-[600px] w-full max-w-[1000px] overflow-hidden rounded-lg border transition-transform duration-200 ${
            isBlueprint
              ? "blueprint-grid border-steel"
              : showGrid
              ? "smartboard-porcelain border-border"
              : "border-border bg-paper"
          }`}
          style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})` }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 1000 600"
            className="h-full w-full"
            style={{ cursor, touchAction: activeTool === "pointer" ? "auto" : "none" }}
            xmlns="http://www.w3.org/2000/svg"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <g id="teacher-layer">
              {actions.slice(0, visibleCount).map((action, idx) => (
                <WhiteboardActionRenderer
                  key={(action as { id?: string }).id || `action-${idx}`}
                  action={action}
                  actionIndex={idx}
                  isBlueprint={isBlueprint}
                  onSelectAction={setInspectedAction}
                  isSelected={Boolean(
                    inspectedAction &&
                      "id" in inspectedAction &&
                      "id" in action &&
                      inspectedAction.id === action.id
                  )}
                />
              ))}
            </g>

            <g id="student-layer">
              {[...studentStrokes, ...(currentStroke ? [currentStroke] : [])].map((stroke) => (
                <path
                  key={stroke.id}
                  d={strokePath(stroke.points)}
                  stroke={stroke.color}
                  strokeWidth={stroke.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
            </g>

            {actions.length === 0 && (
              <g className="pointer-events-none">
                <text
                  x="500"
                  y="285"
                  fill={isBlueprint ? "#cbd5e1" : "#1b1b1b"}
                  fontSize="34"
                  textAnchor="middle"
                  fontFamily="Caveat, cursive"
                >
                  Press play and I&apos;ll start explaining
                </text>
                <text
                  x="500"
                  y="320"
                  fill="#575552"
                  fontSize="13"
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                >
                  Everything I say gets drawn here, step by step.
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Inspection card */}
        {inspectedAction && (
          <div className="absolute left-1/2 top-5 z-30 w-full max-w-lg -translate-x-1/2 px-4">
            <div className="paper-card flex items-start justify-between gap-3 p-4 shadow-lift">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 rounded-lg bg-electric/10 p-2 text-electric">
                  <Info className="h-4 w-4" />
                </span>
                <div>
                  <p className="eyebrow text-electric">on the board</p>
                  <p className="handwritten mt-0.5 text-2xl leading-tight">
                    {(inspectedAction as { text?: string; caption?: string; label?: string }).text ||
                      (inspectedAction as { caption?: string }).caption ||
                      (inspectedAction as { label?: string }).label ||
                      "Diagram element"}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {(inspectedAction as { details?: string }).details ||
                      (inspectedAction as { tooltip?: string }).tooltip ||
                      "Part of the explanation being drawn."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedAction(null)}
                aria-label="Close"
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tool dock — available on touch devices too */}
        <div className="absolute bottom-4 left-1/2 z-30 flex max-w-[94%] -translate-x-1/2 flex-wrap items-center justify-center gap-0.5 rounded-full border border-border bg-paper/95 px-2.5 py-1.5 shadow-lift backdrop-blur">
          {toolButton("pointer", MousePointer2, "Inspect elements")}
          {toolButton("pan", Move, "Pan the board")}
          {toolButton("pen", PenTool, "Pen")}
          {toolButton("highlighter", Highlighter, "Highlighter")}
          {toolButton("eraser", Eraser, "Erase your marks")}

          {activeTool === "pen" && (
            <span className="flex items-center gap-1 px-1">
              {PEN_COLORS.map((c) => (
                <button
                  key={c.color}
                  onClick={() => setPenColor(c.color)}
                  aria-label={`Pen colour ${c.title}`}
                  className={`h-3 w-3 rounded-full transition-transform ${
                    penColor === c.color ? "scale-125 ring-2 ring-electric/50" : "opacity-70"
                  }`}
                  style={{ backgroundColor: c.color }}
                />
              ))}
            </span>
          )}

          <button
            onClick={handleUndo}
            disabled={strokeHistory.length === 0 && studentStrokes.length === 0}
            title="Undo your last mark"
            aria-label="Undo"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>

          {studentStrokes.length > 0 && (
            <button
              onClick={handleClearDrawings}
              title="Clear all your marks"
              aria-label="Clear drawings"
              className="rounded-full p-1.5 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}

          <span className="mx-1 h-3 w-px bg-border" />

          <button
            onClick={() => setCanvasTheme((t) => (t === "porcelain" ? "blueprint" : "porcelain"))}
            title={isBlueprint ? "Switch to paper board" : "Switch to blueprint board"}
            aria-label="Toggle board theme"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {isBlueprint ? <Moon className="h-3.5 w-3.5 text-electric" /> : <Sun className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={onToggleGrid}
            title={showGrid ? "Hide grid" : "Show grid"}
            aria-label="Toggle grid"
            className={`rounded-full p-1.5 ${
              showGrid ? "bg-electric/10 text-electric" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid className="h-3.5 w-3.5" />
          </button>

          <span className="mx-1 h-3 w-px bg-border" />

          <button
            onClick={onZoomOut}
            disabled={zoom <= 0.75}
            aria-label="Zoom out"
            className="rounded-full p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          <span className="w-8 text-center font-mono text-[10px] font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            disabled={zoom >= 1.5}
            aria-label="Zoom in"
            className="rounded-full p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              setPanOffset({ x: 0, y: 0 });
              onResetZoom();
            }}
            title="Reset view"
            aria-label="Reset view"
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            aria-label="Toggle fullscreen"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
