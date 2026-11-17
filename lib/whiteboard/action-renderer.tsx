"use client";

import React from "react";
import { motion } from "framer-motion";
import { WhiteboardAction } from "@/lib/schemas/lesson-schema";

interface WhiteboardActionRendererProps {
  action: WhiteboardAction;
  onSelectAction?: (action: WhiteboardAction) => void;
  isSelected?: boolean;
  isBlueprint?: boolean;
  actionIndex?: number;
}

/** Board type faces, matching the desk design system. */
const FONT_STACKS = {
  hand: "Caveat, Kalam, cursive",
  sans: "Inter, system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
} as const;

export const WhiteboardActionRenderer: React.FC<WhiteboardActionRendererProps> = ({
  action,
  onSelectAction,
  isSelected = false,
  isBlueprint = false,
  actionIndex = 0,
}) => {
  const hasDetails = Boolean((action as any).details || (action as any).tooltip);
  const handleInteraction = (e: React.MouseEvent) => {
    if (hasDetails && onSelectAction) {
      e.stopPropagation();
      onSelectAction(action);
    }
  };

  const entryDelay = Math.min(1.0, actionIndex * 0.06);

  switch (action.type) {
    case "drawImage": {
      return (
        <motion.g
          key={action.id}
          id={action.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: entryDelay, ease: "easeOut" }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer group" : ""}
        >
          {/* Clean shadow container */}
          <rect
            x={action.x - 3}
            y={action.y - 3}
            width={action.width + 6}
            height={action.height + 6}
            rx={10}
            fill={isBlueprint ? "#0f172a" : "#ffffff"}
            stroke={isSelected ? "#1677ff" : isBlueprint ? "#1e293b" : "#e2e8f0"}
            strokeWidth={isSelected ? 2.5 : 1}
            className="filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          />

          <image
            href={action.url}
            xlinkHref={action.url}
            x={action.x}
            y={action.y}
            width={action.width}
            height={action.height}
            preserveAspectRatio="xMidYMid meet"
            className="rounded-lg"
          />

          {/* Caption badge */}
          {action.caption && (
            <g transform={`translate(${action.x + 6}, ${action.y + action.height - 26})`}>
              <rect
                width={Math.min(action.width - 12, Math.max(90, action.caption.length * 7.5 + 16))}
                height={20}
                rx={5}
                fill="rgba(15, 23, 42, 0.8)"
              />
              <text
                x={8}
                y={14}
                fontSize={10}
                fill="#f8fafc"
                fontWeight="600"
                fontFamily="system-ui, -apple-system, sans-serif"
                className="select-none"
              >
                {action.caption}
              </text>
            </g>
          )}

          {action.attribution && (
            <text
              x={action.x + action.width}
              y={action.y + action.height + 14}
              fontSize={8}
              fill={isBlueprint ? "#64748b" : "#94a3b8"}
              textAnchor="end"
              fontFamily="system-ui, sans-serif"
              className="select-none"
            >
              {action.attribution}
            </text>
          )}
        </motion.g>
      );
    }

    case "addText": {
      const textColor = isBlueprint
        ? action.fill && action.fill !== "#0f172a" && action.fill !== "#334155"
          ? action.fill
          : "#f8fafc"
        : action.fill && action.fill !== "#f8fafc"
        ? action.fill
        : "#0f172a";

      return (
        <motion.text
          key={action.id}
          id={action.id}
          x={action.x}
          y={action.y}
          fontSize={action.fontSize || 16}
          fill={textColor}
          fontWeight={action.fontWeight || "normal"}
          textAnchor={action.textAnchor || "start"}
          fontFamily={FONT_STACKS[action.font || "sans"]}
          // Only opacity is animated. Framer Motion treats `y` as a transform,
          // so animating it on an element that already carries a y attribute
          // renders the text at double its intended position — which is what
          // used to push every label outside its box.
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: entryDelay, ease: "easeOut" }}
          onClick={handleInteraction}
          className={`select-none ${hasDetails ? "cursor-pointer" : ""}`}
        >
          {action.text}
        </motion.text>
      );
    }

    case "drawLine": {
      const strokeColor = isBlueprint && action.stroke === "#1677ff" ? "#38bdf8" : action.stroke || "#1677ff";
      return (
        <motion.line
          key={action.id}
          id={action.id}
          x1={action.x1}
          y1={action.y1}
          x2={action.x2}
          y2={action.y2}
          stroke={strokeColor}
          strokeWidth={action.strokeWidth || 2}
          strokeDasharray={action.strokeDasharray}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: entryDelay, ease: "easeInOut" }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer" : ""}
        />
      );
    }

    case "drawCircle": {
      const strokeColor = isBlueprint ? "#38bdf8" : action.stroke || "#0284c7";
      const fillColor = isBlueprint ? "rgba(56, 189, 248, 0.1)" : action.fill || "rgba(224, 242, 254, 0.5)";

      return (
        <motion.circle
          key={action.id}
          id={action.id}
          cx={action.cx}
          cy={action.cy}
          r={action.r}
          stroke={strokeColor}
          strokeWidth={action.strokeWidth || 2}
          strokeDasharray={action.strokeDasharray}
          fill={fillColor}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ originX: `${action.cx}px`, originY: `${action.cy}px` }}
          transition={{ duration: 0.4, delay: entryDelay, ease: "easeOut" }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer" : ""}
        />
      );
    }

    case "drawRect": {
      const strokeColor = isBlueprint ? "#38bdf8" : action.stroke || "#059669";
      const fillColor = isBlueprint
        ? "rgba(15, 23, 42, 0.85)"
        : action.fill || "rgba(241, 245, 249, 0.7)";

      return (
        <motion.rect
          key={action.id}
          id={action.id}
          x={action.x}
          y={action.y}
          width={action.width}
          height={action.height}
          rx={action.rx || 8}
          stroke={strokeColor}
          strokeWidth={action.strokeWidth || 1.5}
          strokeDasharray={action.strokeDasharray}
          fill={fillColor}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            originX: `${action.x + action.width / 2}px`,
            originY: `${action.y + action.height / 2}px`,
          }}
          transition={{ duration: 0.4, delay: entryDelay, ease: "easeOut" }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer" : ""}
        />
      );
    }

    case "drawPath": {
      return (
        <motion.path
          key={action.id}
          id={action.id}
          d={action.path}
          stroke={action.stroke || (isBlueprint ? "#38bdf8" : "#2563eb")}
          strokeWidth={action.strokeWidth || 2.5}
          fill={action.fill || "none"}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: entryDelay, ease: "easeInOut" }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer" : ""}
        />
      );
    }

    case "drawArrow": {
      const dx = action.x2 - action.x1;
      const dy = action.y2 - action.y1;
      const angle = Math.atan2(dy, dx);
      const headLength = 10;

      const p1x = action.x2 - headLength * Math.cos(angle - Math.PI / 6);
      const p1y = action.y2 - headLength * Math.sin(angle - Math.PI / 6);
      const p2x = action.x2 - headLength * Math.cos(angle + Math.PI / 6);
      const p2y = action.y2 - headLength * Math.sin(angle + Math.PI / 6);

      const midX = (action.x1 + action.x2) / 2;
      const midY = (action.y1 + action.y2) / 2;
      const arrowStroke = isBlueprint ? "#38bdf8" : action.stroke || "#0284c7";

      return (
        <motion.g
          key={action.id}
          id={action.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: entryDelay }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer" : ""}
        >
          {/* Arrow shaft */}
          <motion.line
            x1={action.x1}
            y1={action.y1}
            x2={action.x2}
            y2={action.y2}
            stroke={arrowStroke}
            strokeWidth={action.strokeWidth || 2}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: entryDelay, ease: "easeInOut" }}
          />
          {/* Clean arrowhead — no moving dots */}
          <polygon
            points={`${action.x2},${action.y2} ${p1x},${p1y} ${p2x},${p2y}`}
            fill={arrowStroke}
          />

          {/* Label */}
          {action.label && (
            <g>
              <rect
                x={midX - (action.label.length * 3.5 + 8)}
                y={midY - 16}
                width={action.label.length * 7 + 16}
                height={18}
                rx={4}
                fill={isBlueprint ? "#0f172a" : "#ffffff"}
                stroke={isBlueprint ? "#38bdf8" : "#e2e8f0"}
                strokeWidth={1}
                className="filter drop-shadow-sm"
              />
              <text
                x={midX}
                y={midY - 4}
                fontSize={11}
                fill={arrowStroke}
                textAnchor="middle"
                fontWeight="600"
                fontFamily="system-ui, sans-serif"
                className="select-none"
              >
                {action.label}
              </text>
            </g>
          )}
        </motion.g>
      );
    }

    case "highlight": {
      return (
        <motion.rect
          key={action.id}
          id={action.id}
          x={action.x}
          y={action.y}
          width={action.width}
          height={action.height}
          rx={4}
          fill={action.color || "rgba(254, 240, 138, 0.35)"}
          stroke={action.color ? action.color.replace(/[\d.]+\)$/, "0.6)") : "rgba(234, 179, 8, 0.4)"}
          strokeWidth={1}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer" : ""}
        />
      );
    }

    case "addLabel": {
      const estimatedWidth = Math.max(60, action.text.length * 7.5 + 20);
      return (
        <motion.g
          key={action.id}
          id={action.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer" : ""}
        >
          <rect
            x={action.x}
            y={action.y - 18}
            width={estimatedWidth}
            height={22}
            rx={11}
            fill={action.bg || "#f8fafc"}
            stroke={isSelected ? "#1677ff" : (action.borderColor || action.color || "#cbd5e1")}
            strokeWidth={isSelected ? 2 : 1}
            className="filter drop-shadow-sm"
          />
          <text
            x={action.x + estimatedWidth / 2}
            y={action.y - 3}
            fontSize={11}
            fill={action.color || "#1e293b"}
            textAnchor="middle"
            fontWeight="600"
            fontFamily="system-ui, -apple-system, sans-serif"
            className="select-none"
          >
            {action.text}
          </text>
        </motion.g>
      );
    }

    case "erase":
    case "clear":
      return null;

    default:
      return null;
  }
};
