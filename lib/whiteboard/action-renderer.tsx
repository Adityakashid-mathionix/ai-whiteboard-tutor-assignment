"use client";

import React from "react";
import { motion } from "framer-motion";
import { WhiteboardAction } from "@/lib/schemas/lesson-schema";

interface WhiteboardActionRendererProps {
  action: WhiteboardAction;
}

export const WhiteboardActionRenderer: React.FC<WhiteboardActionRendererProps> = ({
  action,
}) => {
  switch (action.type) {
    case "addText": {
      return (
        <motion.text
          key={action.id}
          id={action.id}
          x={action.x}
          y={action.y}
          fontSize={action.fontSize || 18}
          fill={action.fill || "#f8fafc"}
          fontWeight={action.fontWeight || "normal"}
          fontFamily="system-ui, -apple-system, sans-serif"
          initial={{ opacity: 0, y: action.y - 6 }}
          animate={{ opacity: 1, y: action.y }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="select-none"
        >
          {action.text}
        </motion.text>
      );
    }

    case "drawLine": {
      return (
        <motion.line
          key={action.id}
          id={action.id}
          x1={action.x1}
          y1={action.y1}
          x2={action.x2}
          y2={action.y2}
          stroke={action.stroke || "#60a5fa"}
          strokeWidth={action.strokeWidth || 3}
          strokeDasharray={action.strokeDasharray}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        />
      );
    }

    case "drawCircle": {
      return (
        <motion.circle
          key={action.id}
          id={action.id}
          cx={action.cx}
          cy={action.cy}
          r={action.r}
          stroke={action.stroke || "#818cf8"}
          strokeWidth={action.strokeWidth || 3}
          fill={action.fill || "none"}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ originX: `${action.cx}px`, originY: `${action.cy}px` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      );
    }

    case "drawRect": {
      return (
        <motion.rect
          key={action.id}
          id={action.id}
          x={action.x}
          y={action.y}
          width={action.width}
          height={action.height}
          rx={action.rx || 8}
          stroke={action.stroke || "#34d399"}
          strokeWidth={action.strokeWidth || 2}
          fill={action.fill || "rgba(30, 41, 59, 0.4)"}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            originX: `${action.x + action.width / 2}px`,
            originY: `${action.y + action.height / 2}px`,
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      );
    }

    case "drawPath": {
      return (
        <motion.path
          key={action.id}
          id={action.id}
          d={action.path}
          stroke={action.stroke || "#a78bfa"}
          strokeWidth={action.strokeWidth || 3}
          fill={action.fill || "none"}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        />
      );
    }

    case "drawArrow": {
      const dx = action.x2 - action.x1;
      const dy = action.y2 - action.y1;
      const angle = Math.atan2(dy, dx);
      const headLength = 12;

      const p1x = action.x2 - headLength * Math.cos(angle - Math.PI / 6);
      const p1y = action.y2 - headLength * Math.sin(angle - Math.PI / 6);
      const p2x = action.x2 - headLength * Math.cos(angle + Math.PI / 6);
      const p2y = action.y2 - headLength * Math.sin(angle + Math.PI / 6);

      const midX = (action.x1 + action.x2) / 2;
      const midY = (action.y1 + action.y2) / 2;

      return (
        <motion.g
          key={action.id}
          id={action.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Main line */}
          <motion.line
            x1={action.x1}
            y1={action.y1}
            x2={action.x2}
            y2={action.y2}
            stroke={action.stroke || "#38bdf8"}
            strokeWidth={action.strokeWidth || 3}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
          {/* Arrowhead polygon */}
          <polygon
            points={`${action.x2},${action.y2} ${p1x},${p1y} ${p2x},${p2y}`}
            fill={action.stroke || "#38bdf8"}
          />
          {/* Optional Label */}
          {action.label && (
            <text
              x={midX}
              y={midY - 10}
              fontSize={14}
              fill={action.stroke || "#38bdf8"}
              textAnchor="middle"
              className="select-none font-medium"
            >
              {action.label}
            </text>
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
          rx={6}
          fill={action.color || "rgba(251, 191, 36, 0.2)"}
          stroke={action.color?.replace(/[\d.]+\)$/, "0.5)") || "rgba(251, 191, 36, 0.5)"}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        />
      );
    }

    case "addLabel": {
      const estimatedWidth = Math.max(70, action.text.length * 9 + 20);
      return (
        <motion.g
          key={action.id}
          id={action.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <rect
            x={action.x}
            y={action.y - 20}
            width={estimatedWidth}
            height={26}
            rx={13}
            fill={action.bg || "rgba(15, 23, 42, 0.9)"}
            stroke={action.color || "#38bdf8"}
            strokeWidth={1.5}
          />
          <text
            x={action.x + estimatedWidth / 2}
            y={action.y - 3}
            fontSize={12}
            fill={action.color || "#38bdf8"}
            textAnchor="middle"
            fontWeight="600"
            className="select-none"
          >
            {action.text}
          </text>
        </motion.g>
      );
    }

    case "erase":
    case "clear":
      // Handled by state reducer, no visual element
      return null;

    default:
      return null;
  }
};
