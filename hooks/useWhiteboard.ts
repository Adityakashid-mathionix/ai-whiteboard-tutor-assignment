"use client";

import { useState, useCallback } from "react";
import { WhiteboardAction } from "@/lib/schemas/lesson-schema";
import { sanitizeWhiteboardAction } from "@/lib/whiteboard/action-validator";

export function useWhiteboard() {
  const [actions, setActions] = useState<WhiteboardAction[]>([]);
  const [zoom, setZoom] = useState<number>(1);
  const [showGrid, setShowGrid] = useState<boolean>(false);

  /**
   * Applies an array of actions on top of current board state
   */
  const applyActions = useCallback((newActions: WhiteboardAction[]) => {
    setActions((prev) => {
      let current = [...prev];
      for (const rawAction of newActions) {
        const action = sanitizeWhiteboardAction(rawAction);
        if (action.type === "clear") {
          current = [];
        } else if (action.type === "erase") {
          current = current.filter((item) => (item as { id?: string }).id !== action.targetId);
        } else {
          // Replace if exists, or append
          const existingIdx = current.findIndex(
            (item) => (item as { id?: string }).id === action.id
          );
          if (existingIdx >= 0) {
            current[existingIdx] = action;
          } else {
            current.push(action);
          }
        }
      }
      return current;
    });
  }, []);

  /**
   * Sets canvas strictly to the cumulative state up to a given segment
   */
  const setCumulativeState = useCallback(
    (segmentsActions: WhiteboardAction[][], upToSegmentIndex: number) => {
      let accumulated: WhiteboardAction[] = [];
      for (let i = 0; i <= upToSegmentIndex && i < segmentsActions.length; i++) {
        for (const rawAction of segmentsActions[i]) {
          const action = sanitizeWhiteboardAction(rawAction);
          if (action.type === "clear") {
            accumulated = [];
          } else if (action.type === "erase") {
            accumulated = accumulated.filter(
              (item) => (item as { id?: string }).id !== action.targetId
            );
          } else {
            const existingIdx = accumulated.findIndex(
              (item) => (item as { id?: string }).id === action.id
            );
            if (existingIdx >= 0) {
              accumulated[existingIdx] = action;
            } else {
              accumulated.push(action);
            }
          }
        }
      }
      setActions(accumulated);
    },
    []
  );

  const clearBoard = useCallback(() => {
    setActions([]);
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  return {
    actions,
    zoom,
    setZoom,
    showGrid,
    setShowGrid,
    applyActions,
    setCumulativeState,
    clearBoard,
    resetZoom,
  };
}
