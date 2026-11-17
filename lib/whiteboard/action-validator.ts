import { WhiteboardAction } from "@/lib/schemas/lesson-schema";
import { safePathData } from "./safe-url";

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Validates and safely bounds-clamps whiteboard actions within the 1000 x 600 canvas
 */
export function sanitizeWhiteboardAction(action: WhiteboardAction): WhiteboardAction {
  switch (action.type) {
    case "addText":
      return {
        ...action,
        x: clamp(action.x, 20, 980),
        y: clamp(action.y, 20, 580),
        text: action.text.replace(/[<>]/g, ""), // strip raw tags
      };
    case "drawLine":
      return {
        ...action,
        x1: clamp(action.x1, 0, 1000),
        y1: clamp(action.y1, 0, 600),
        x2: clamp(action.x2, 0, 1000),
        y2: clamp(action.y2, 0, 600),
      };
    case "drawCircle":
      return {
        ...action,
        cx: clamp(action.cx, 0, 1000),
        cy: clamp(action.cy, 0, 600),
        r: clamp(action.r, 2, 400),
      };
    case "drawRect":
      return {
        ...action,
        x: clamp(action.x, 0, 1000),
        y: clamp(action.y, 0, 600),
        width: clamp(action.width, 2, 1000),
        height: clamp(action.height, 2, 600),
      };
    case "drawArrow":
      return {
        ...action,
        x1: clamp(action.x1, 0, 1000),
        y1: clamp(action.y1, 0, 600),
        x2: clamp(action.x2, 0, 1000),
        y2: clamp(action.y2, 0, 600),
        label: action.label ? action.label.replace(/[<>]/g, "") : undefined,
      };
    case "highlight":
      return {
        ...action,
        x: clamp(action.x, 0, 1000),
        y: clamp(action.y, 0, 600),
        width: clamp(action.width, 4, 1000),
        height: clamp(action.height, 4, 600),
      };
    case "addLabel":
      return {
        ...action,
        x: clamp(action.x, 20, 980),
        y: clamp(action.y, 20, 580),
        text: action.text.replace(/[<>]/g, ""),
      };
    case "drawPath":
      // Path data reaches the DOM verbatim, so restrict it to the SVG path
      // grammar rather than trusting whatever produced it.
      return { ...action, path: safePathData(action.path) };
    case "erase":
    case "clear":
      return action;
    default:
      return action;
  }
}
