import { z } from "zod";

// Base coordinate boundaries: ViewBox is 1000 x 600
export const WhiteboardTextActionSchema = z.object({
  type: z.literal("addText"),
  id: z.string().optional().default(() => Math.random().toString(36).substring(2, 9)),
  text: z.string(),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(600),
  fontSize: z.number().min(10).max(60).optional().default(18),
  fill: z.string().optional().default("#0f172a"),
  fontWeight: z.enum(["normal", "bold", "600"]).optional().default("normal"),
  details: z.string().optional(),
  tooltip: z.string().optional(),
});

export const WhiteboardLineActionSchema = z.object({
  type: z.literal("drawLine"),
  id: z.string().optional().default(() => Math.random().toString(36).substring(2, 9)),
  x1: z.number().min(0).max(1000),
  y1: z.number().min(0).max(600),
  x2: z.number().min(0).max(1000),
  y2: z.number().min(0).max(600),
  stroke: z.string().optional().default("#2563eb"),
  strokeWidth: z.number().min(1).max(14).optional().default(3),
  strokeDasharray: z.string().optional(),
  details: z.string().optional(),
  tooltip: z.string().optional(),
});

export const WhiteboardCircleActionSchema = z.object({
  type: z.literal("drawCircle"),
  id: z.string().optional().default(() => Math.random().toString(36).substring(2, 9)),
  cx: z.number().min(0).max(1000),
  cy: z.number().min(0).max(600),
  r: z.number().min(2).max(400),
  stroke: z.string().optional().default("#0284c7"),
  strokeWidth: z.number().min(1).max(14).optional().default(3),
  strokeDasharray: z.string().optional(),
  fill: z.string().optional().default("none"),
  details: z.string().optional(),
  tooltip: z.string().optional(),
});

export const WhiteboardRectActionSchema = z.object({
  type: z.literal("drawRect"),
  id: z.string().optional().default(() => Math.random().toString(36).substring(2, 9)),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(600),
  width: z.number().min(2).max(1000),
  height: z.number().min(2).max(600),
  rx: z.number().min(0).max(40).optional().default(8),
  stroke: z.string().optional().default("#059669"),
  strokeWidth: z.number().min(1).max(14).optional().default(2),
  strokeDasharray: z.string().optional(),
  fill: z.string().optional().default("rgba(241, 245, 249, 0.7)"),
  details: z.string().optional(),
  tooltip: z.string().optional(),
});

export const WhiteboardPathActionSchema = z.object({
  type: z.literal("drawPath"),
  id: z.string().optional().default(() => Math.random().toString(36).substring(2, 9)),
  path: z.string(),
  stroke: z.string().optional().default("#2563eb"),
  strokeWidth: z.number().min(1).max(14).optional().default(3),
  fill: z.string().optional().default("none"),
  details: z.string().optional(),
  tooltip: z.string().optional(),
});

export const WhiteboardArrowActionSchema = z.object({
  type: z.literal("drawArrow"),
  id: z.string().optional().default(() => Math.random().toString(36).substring(2, 9)),
  x1: z.number().min(0).max(1000),
  y1: z.number().min(0).max(600),
  x2: z.number().min(0).max(1000),
  y2: z.number().min(0).max(600),
  stroke: z.string().optional().default("#0284c7"),
  strokeWidth: z.number().min(1).max(14).optional().default(3),
  label: z.string().optional(),
  details: z.string().optional(),
  tooltip: z.string().optional(),
});

export const WhiteboardHighlightActionSchema = z.object({
  type: z.literal("highlight"),
  id: z.string().optional().default(() => Math.random().toString(36).substring(2, 9)),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(600),
  width: z.number().min(4).max(1000),
  height: z.number().min(4).max(600),
  color: z.string().optional().default("rgba(254, 240, 138, 0.45)"),
  details: z.string().optional(),
});

export const WhiteboardLabelActionSchema = z.object({
  type: z.literal("addLabel"),
  id: z.string().optional().default(() => Math.random().toString(36).substring(2, 9)),
  text: z.string(),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(600),
  color: z.string().optional().default("#1e293b"),
  bg: z.string().optional().default("#f1f5f9"),
  borderColor: z.string().optional().default("#cbd5e1"),
  details: z.string().optional(),
  tooltip: z.string().optional(),
});

export const WhiteboardImageActionSchema = z.object({
  type: z.literal("drawImage"),
  id: z.string().optional().default(() => Math.random().toString(36).substring(2, 9)),
  url: z.string().url(),
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(600),
  width: z.number().min(40).max(900),
  height: z.number().min(40).max(560),
  caption: z.string().optional(),
  attribution: z.string().optional(),
  license: z.string().optional(),
  details: z.string().optional(),
  tooltip: z.string().optional(),
});

export const WhiteboardEraseActionSchema = z.object({
  type: z.literal("erase"),
  targetId: z.string(),
});

export const WhiteboardClearActionSchema = z.object({
  type: z.literal("clear"),
});

export const WhiteboardActionSchema = z.discriminatedUnion("type", [
  WhiteboardTextActionSchema,
  WhiteboardLineActionSchema,
  WhiteboardCircleActionSchema,
  WhiteboardRectActionSchema,
  WhiteboardPathActionSchema,
  WhiteboardArrowActionSchema,
  WhiteboardHighlightActionSchema,
  WhiteboardLabelActionSchema,
  WhiteboardImageActionSchema,
  WhiteboardEraseActionSchema,
  WhiteboardClearActionSchema,
]);

export const LessonSegmentSchema = z.object({
  id: z.string(),
  heading: z.string().min(2),
  narration: z.string().min(10),
  keyTakeaway: z.string().optional().default(""),
  visualQuery: z.string().optional(),
  visualType: z.string().optional(),
  visualDescription: z.string().optional(),
  visualActions: z.array(WhiteboardActionSchema),
});

export const LessonSchema = z.object({
  id: z.string().optional().default(() => `lesson-${Date.now()}`),
  title: z.string().min(2),
  topic: z.string().min(2),
  summary: z.string().min(10),
  language: z.string().optional().default("en"),
  learningLevel: z.string().optional().default("beginner"),
  estimatedDuration: z.number().min(30).max(300).optional().default(120),
  keyTakeaways: z.array(z.string()).optional(),
  segments: z.array(LessonSegmentSchema).min(2).max(10),
  createdAt: z.string().optional().default(() => new Date().toISOString()),
});

// Use z.input so all optional fields with defaults can be omitted when defining lessons
export type WhiteboardAction = z.input<typeof WhiteboardActionSchema>;
export type WhiteboardTextAction = z.input<typeof WhiteboardTextActionSchema>;
export type WhiteboardLineAction = z.input<typeof WhiteboardLineActionSchema>;
export type WhiteboardCircleAction = z.input<typeof WhiteboardCircleActionSchema>;
export type WhiteboardRectAction = z.input<typeof WhiteboardRectActionSchema>;
export type WhiteboardPathAction = z.input<typeof WhiteboardPathActionSchema>;
export type WhiteboardArrowAction = z.input<typeof WhiteboardArrowActionSchema>;
export type WhiteboardHighlightAction = z.input<typeof WhiteboardHighlightActionSchema>;
export type WhiteboardLabelAction = z.input<typeof WhiteboardLabelActionSchema>;
export type WhiteboardImageAction = z.input<typeof WhiteboardImageActionSchema>;
export type WhiteboardEraseAction = z.input<typeof WhiteboardEraseActionSchema>;
export type WhiteboardClearAction = z.input<typeof WhiteboardClearActionSchema>;

export type LessonSegment = z.input<typeof LessonSegmentSchema>;
export type Lesson = z.input<typeof LessonSchema>;
