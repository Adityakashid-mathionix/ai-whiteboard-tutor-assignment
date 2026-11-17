import { Lesson, LessonSegment, WhiteboardAction } from "@/lib/schemas/lesson-schema";

export type { Lesson, LessonSegment, WhiteboardAction };

export type PlaybackStatus = "idle" | "playing" | "paused" | "completed" | "error";

export type PlaybackSpeed = 0.75 | 1 | 1.25 | 1.5;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  relatedSegmentId?: string;
}

export interface PlayerState {
  status: PlaybackStatus;
  currentSegmentIndex: number;
  speed: PlaybackSpeed;
  isMuted: boolean;
  error: string | null;
}
