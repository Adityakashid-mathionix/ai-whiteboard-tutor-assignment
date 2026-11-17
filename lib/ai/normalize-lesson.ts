import { Lesson, WhiteboardAction } from "@/lib/schemas/lesson-schema";
import { EducationalVisualAsset } from "@/lib/visuals/visual-attribution";
import { composeSegmentLayout } from "@/lib/whiteboard/layout/segment-layout";
import { fitText } from "@/lib/whiteboard/layout/text-utils";

type RawRecord = Record<string, unknown>;

export interface NormalizeOptions {
  topic: string;
  visualAssets?: EducationalVisualAsset[];
  level?: string;
  language?: string;
}

const VALID_ACTION_TYPES = new Set([
  "addText",
  "drawLine",
  "drawCircle",
  "drawRect",
  "drawPath",
  "drawArrow",
  "highlight",
  "addLabel",
  "drawImage",
  "erase",
  "clear",
]);

const TYPE_ALIASES: Record<string, string> = {
  text: "addText",
  circle: "drawCircle",
  line: "drawLine",
  arrow: "drawArrow",
  rect: "drawRect",
  rectangle: "drawRect",
  path: "drawPath",
  label: "addLabel",
  image: "drawImage",
};

const NEAR_WHITE = new Set(["#fff", "#ffffff", "#f8fafc", "#f1f5f9"]);

function isRecord(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null;
}

function str(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function num(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isLightInk(fill: string): boolean {
  if (!fill) return true;
  const normalized = fill.trim().toLowerCase();
  return NEAR_WHITE.has(normalized) || normalized.includes("255, 255, 255");
}

function anchorOf(value: unknown): "start" | "middle" | "end" {
  const raw = str(value).toLowerCase();
  if (raw === "middle" || raw === "center" || raw === "centre") return "middle";
  if (raw === "end" || raw === "right") return "end";
  return "start";
}

/** Infers the action type when the model emitted an unknown or missing one. */
function inferType(action: RawRecord): string {
  if (typeof action.url === "string") return "drawImage";
  if (typeof action.text === "string") return "addText";
  if (action.cx !== undefined) return "drawCircle";
  if (action.x1 !== undefined && action.x2 !== undefined) return "drawLine";
  if (action.path !== undefined) return "drawPath";
  return "drawRect";
}

function resolveType(action: RawRecord): string {
  const raw = str(action.type, "").trim();
  const aliased = TYPE_ALIASES[raw] || raw;
  if (VALID_ACTION_TYPES.has(aliased)) return aliased;
  return inferType(action);
}

/**
 * Converts one loosely-shaped model action into a schema-valid whiteboard
 * action, filling sane defaults and forcing readable ink on a white board.
 */
export function coerceAction(
  raw: unknown,
  segmentIndex: number,
  actionIndex: number,
  heading: string
): WhiteboardAction | null {
  if (!isRecord(raw)) return null;

  const type = resolveType(raw);
  const id = str(raw.id) || `act-${segmentIndex}-${actionIndex}`;

  switch (type) {
    case "clear":
      return { type: "clear" };

    case "erase": {
      const targetId = str(raw.targetId || raw.id);
      return targetId ? { type: "erase", targetId } : null;
    }

    case "addText": {
      const fill = str(raw.fill);
      return {
        type: "addText",
        id,
        text: str(raw.text, heading),
        x: num(raw.x, 500),
        y: num(raw.y, 80),
        fontSize: num(raw.fontSize, 16),
        fill: isLightInk(fill) ? "#1b1b1b" : fill,
        fontWeight: raw.fontWeight === "bold" || raw.fontWeight === "600" ? raw.fontWeight : "normal",
        textAnchor: anchorOf(raw.textAnchor ?? raw.anchor ?? raw.align),
        details: str(raw.details) || undefined,
        tooltip: str(raw.tooltip) || str(raw.text) || undefined,
      };
    }

    case "addLabel":
      return {
        type: "addLabel",
        id,
        text: str(raw.text, heading),
        x: num(raw.x, 80),
        y: num(raw.y, 55),
        color: str(raw.color, "#1e293b"),
        bg: str(raw.bg, "#f1f5f9"),
        borderColor: str(raw.borderColor, "#cbd5e1"),
        details: str(raw.details) || undefined,
        tooltip: str(raw.tooltip) || undefined,
      };

    case "drawCircle":
      return {
        type: "drawCircle",
        id,
        cx: num(raw.cx, 400),
        cy: num(raw.cy, 300),
        r: num(raw.r, 45),
        stroke: str(raw.stroke, "#1677ff"),
        strokeWidth: num(raw.strokeWidth, 2.5),
        fill: str(raw.fill, "rgba(224, 242, 254, 0.6)"),
        details: str(raw.details) || undefined,
        tooltip: str(raw.tooltip) || undefined,
      };

    case "drawRect":
      return {
        type: "drawRect",
        id,
        x: num(raw.x, 300),
        y: num(raw.y, 200),
        width: num(raw.width, 220),
        height: num(raw.height, 140),
        rx: num(raw.rx, 12),
        stroke: str(raw.stroke, "#1677ff"),
        strokeWidth: num(raw.strokeWidth, 2),
        fill: str(raw.fill, "rgba(238, 242, 255, 0.7)"),
        details: str(raw.details) || undefined,
        tooltip: str(raw.tooltip) || undefined,
      };

    case "drawLine":
      return {
        type: "drawLine",
        id,
        x1: num(raw.x1, 150),
        y1: num(raw.y1, 80),
        x2: num(raw.x2, 850),
        y2: num(raw.y2, 80),
        stroke: str(raw.stroke, "#1677ff"),
        strokeWidth: num(raw.strokeWidth, 2),
        strokeDasharray: str(raw.strokeDasharray) || undefined,
      };

    case "drawArrow":
      return {
        type: "drawArrow",
        id,
        x1: num(raw.x1, 300),
        y1: num(raw.y1, 300),
        x2: num(raw.x2, 480),
        y2: num(raw.y2, 300),
        stroke: str(raw.stroke, "#0284c7"),
        strokeWidth: num(raw.strokeWidth, 2.5),
        label: str(raw.label) || undefined,
        details: str(raw.details) || undefined,
      };

    case "drawPath": {
      const path = str(raw.path || raw.d);
      if (path.length < 2) return null;
      return {
        type: "drawPath",
        id,
        path,
        stroke: str(raw.stroke, "#2563eb"),
        strokeWidth: num(raw.strokeWidth, 2.5),
        fill: str(raw.fill, "none"),
        details: str(raw.details) || undefined,
        tooltip: str(raw.tooltip) || undefined,
      };
    }

    case "highlight":
      return {
        type: "highlight",
        id,
        x: num(raw.x, 120),
        y: num(raw.y, 420),
        width: num(raw.width, 300),
        height: num(raw.height, 40),
        color: str(raw.color, "rgba(254, 240, 138, 0.35)"),
        details: str(raw.details) || undefined,
        tooltip: str(raw.tooltip) || undefined,
      };

    case "drawImage": {
      const url = str(raw.url);
      if (!/^https?:\/\//i.test(url)) return null;
      return {
        type: "drawImage",
        id,
        url,
        x: num(raw.x, 80),
        y: num(raw.y, 130),
        width: num(raw.width, 380),
        height: num(raw.height, 270),
        caption: str(raw.caption) || heading,
        attribution: str(raw.attribution) || "Wikimedia Commons",
        license: str(raw.license) || "CC BY-SA",
        details: str(raw.details) || `Educational illustration for ${heading}`,
        tooltip: str(raw.tooltip) || str(raw.caption) || heading,
      };
    }

    default:
      return null;
  }
}

/**
 * A model layout is kept only when it is genuinely a composed diagram: enough
 * elements, and at least one real shape rather than a wall of text. Thin output
 * is replaced by the deterministic template layout instead.
 */
export function isUsableModelLayout(actions: WhiteboardAction[]): boolean {
  const drawable = actions.filter((a) => a.type !== "clear" && a.type !== "erase");
  const hasShape = drawable.some((a) => a.type !== "addText" && a.type !== "addLabel");
  if (drawable.length < 8 || !hasShape) return false;

  // Every element must sit on the board. Models routinely emit coordinates past
  // the viewBox, which reads as clipped junk on screen.
  const inBounds = drawable.every((a) => {
    const xs: number[] = [];
    const ys: number[] = [];
    const rec = a as unknown as Record<string, number | undefined>;
    (["x", "x1", "x2", "cx"] as const).forEach((k) => {
      if (typeof rec[k] === "number") xs.push(rec[k] as number);
    });
    (["y", "y1", "y2", "cy"] as const).forEach((k) => {
      if (typeof rec[k] === "number") ys.push(rec[k] as number);
    });
    if (a.type === "drawRect" || a.type === "highlight" || a.type === "drawImage") {
      xs.push(a.x + a.width);
      ys.push(a.y + a.height);
    }
    return xs.every((v) => v >= 0 && v <= 1000) && ys.every((v) => v >= 0 && v <= 600);
  });
  if (!inBounds) return false;

  // Reject layouts whose panels pile on top of each other.
  const rects = drawable.filter(
    (a): a is Extract<WhiteboardAction, { type: "drawRect" }> => a.type === "drawRect"
  );
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      const overlapW = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const overlapH = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (overlapW <= 0 || overlapH <= 0) continue;
      const smaller = Math.min(a.width * a.height, b.width * b.height);
      if ((overlapW * overlapH) / smaller > 0.65) return false;
    }
  }

  return true;
}

function hasHeading(actions: WhiteboardAction[]): boolean {
  return actions.some(
    (a) => a.type === "addText" && typeof a.y === "number" && a.y <= 80 && (a.fontSize ?? 0) >= 17
  );
}

function readSegmentActions(segment: RawRecord): unknown[] {
  const candidates = [segment.visualActions, segment.drawActions, segment.actions];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function normalizeSegment(
  rawSegment: unknown,
  index: number,
  visualAssets: EducationalVisualAsset[],
  topic: string
) {
  const segment: RawRecord = isRecord(rawSegment) ? rawSegment : {};

  const heading =
    str(segment.heading) || str(segment.title) || str(segment.chapter) || `Chapter ${index + 1}`;
  const narration =
    str(segment.narration) ||
    str(segment.content) ||
    str(segment.explanation) ||
    str(segment.text) ||
    `In this chapter, we explore ${heading}.`;
  const keyTakeaway =
    str(segment.keyTakeaway) ||
    str(segment.objective) ||
    str(segment.takeaway) ||
    str(segment.summary);

  const coerced = readSegmentActions(segment)
    .map((raw, actionIdx) => coerceAction(raw, index, actionIdx, heading))
    .filter((action): action is WhiteboardAction => action !== null);

  const modelImageActions = coerced.filter((a) => a.type === "drawImage");

  let visualActions: WhiteboardAction[];

  if (isUsableModelLayout(coerced)) {
    // Trust the model's own composition; just guarantee a clean board and a title.
    const body = coerced.filter((a) => a.type !== "clear");
    visualActions = [{ type: "clear" } as WhiteboardAction, ...body];

    if (!hasHeading(body)) {
      visualActions.splice(1, 0, {
        type: "addText",
        id: `hdr-${index}`,
        text: fitText(heading, 760, 20),
        x: 500,
        y: 48,
        fontSize: 20,
        fill: "#0f172a",
        fontWeight: "bold",
        textAnchor: "middle",
        details: `Chapter ${index + 1}: ${heading}`,
      });
    }
  } else {
    visualActions = composeSegmentLayout({
      index,
      heading,
      narration,
      keyTakeaway,
      topic,
      visualHint: isRecord(segment.visual) ? segment.visual : null,
      modelImageActions,
      visualAssets,
    });
  }

  return {
    id: str(segment.id) || `seg-${index + 1}`,
    heading,
    narration,
    keyTakeaway,
    visualActions,
  };
}

/**
 * Turns whatever shape the model returned into a lesson object that satisfies
 * LessonSchema. Never throws on odd input: unusable pieces are replaced with
 * deterministic defaults and validation happens one layer up.
 */
export function normalizeLessonJson(raw: unknown, options: NormalizeOptions): Lesson {
  const root: RawRecord = isRecord(raw) ? raw : {};
  const { topic, visualAssets = [], level, language } = options;

  const rawSegments = Array.isArray(root.segments)
    ? root.segments
    : Array.isArray(root.chapters)
    ? root.chapters
    : [];

  const segments = rawSegments.map((segment, index) =>
    normalizeSegment(segment, index, visualAssets, topic)
  );

  const keyTakeaways = Array.isArray(root.keyTakeaways)
    ? root.keyTakeaways.filter((t): t is string => typeof t === "string")
    : [];

  const duration = num(root.estimatedDuration, 120);

  return {
    id: str(root.id) || `lesson-${Date.now()}`,
    title: str(root.title) || str(root.lessonTitle) || topic,
    topic: str(root.topic) || topic,
    summary:
      str(root.summary) ||
      str(root.overview) ||
      str(root.description) ||
      `Educational masterclass explaining ${topic}.`,
    language: language || str(root.language) || "en",
    learningLevel: level || str(root.learningLevel) || "beginner",
    estimatedDuration: Math.min(300, Math.max(30, duration)),
    keyTakeaways,
    segments,
    createdAt: str(root.createdAt) || new Date().toISOString(),
  };
}
