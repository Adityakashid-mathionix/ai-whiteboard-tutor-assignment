"use client";

import React from "react";
import { motion } from "framer-motion";
import { WhiteboardAction } from "@/lib/schemas/lesson-schema";

interface WhiteboardActionRendererProps {
  action: WhiteboardAction;
  onSelectAction?: (action: WhiteboardAction) => void;
  isSelected?: boolean;
}

export const WhiteboardActionRenderer: React.FC<WhiteboardActionRendererProps> = ({
  action,
  onSelectAction,
  isSelected = false,
}) => {
  const hasDetails = Boolean((action as any).details || (action as any).tooltip);
  const handleInteraction = (e: React.MouseEvent) => {
    if (hasDetails && onSelectAction) {
      e.stopPropagation();
      onSelectAction(action);
    }
  };

  switch (action.type) {
    case "drawImage": {
      return (
        <motion.g
          key={action.id}
          id={action.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer group" : ""}
        >
          {/* Subtle backing container */}
          <rect
            x={action.x - 4}
            y={action.y - 4}
            width={action.width + 8}
            height={action.height + 8}
            rx={12}
            fill="#ffffff"
            stroke={isSelected ? "#2563eb" : "#e2e8f0"}
            strokeWidth={isSelected ? 3 : 1.5}
            className="filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
          />

          {/* Educational Vector Image / Illustration */}
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

          {/* Optional Caption Badge */}
          {action.caption && (
            <g transform={`translate(${action.x + 8}, ${action.y + action.height - 28})`}>
              <rect
                width={Math.min(action.width - 16, Math.max(100, action.caption.length * 8 + 16))}
                height={22}
                rx={6}
                fill="rgba(15, 23, 42, 0.85)"
              />
              <text
                x={10}
                y={15}
                fontSize={11}
                fill="#f8fafc"
                fontWeight="500"
                fontFamily="system-ui, -apple-system, sans-serif"
                className="select-none"
              >
                {action.caption}
              </text>
            </g>
          )}

          {/* Attribution Tag */}
          {action.attribution && (
            <text
              x={action.x + action.width}
              y={action.y + action.height + 16}
              fontSize={9}
              fill="#94a3b8"
              textAnchor="end"
              fontFamily="system-ui, sans-serif"
              className="select-none"
            >
              Source: {action.attribution}
            </text>
          )}
        </motion.g>
      );
    }

    case "addText": {
      return (
        <motion.text
          key={action.id}
          id={action.id}
          x={action.x}
          y={action.y}
          fontSize={action.fontSize || 18}
          fill={action.fill && action.fill !== "#f8fafc" ? action.fill : "#0f172a"}
          fontWeight={action.fontWeight || "normal"}
          fontFamily="system-ui, -apple-system, sans-serif"
          initial={{ opacity: 0, y: action.y - 4 }}
          animate={{ opacity: 1, y: action.y }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          onClick={handleInteraction}
          className={`select-none ${hasDetails ? "cursor-pointer hover:fill-blue-600 transition-colors" : ""}`}
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
          stroke={action.stroke || "#2563eb"}
          strokeWidth={action.strokeWidth || 3}
          strokeDasharray={action.strokeDasharray}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.65, ease: "easeInOut" }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer" : ""}
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
          stroke={action.stroke || "#0284c7"}
          strokeWidth={action.strokeWidth || 3}
          strokeDasharray={action.strokeDasharray}
          fill={action.fill || "none"}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ originX: `${action.cx}px`, originY: `${action.cy}px` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer hover:stroke-blue-600 transition-colors" : ""}
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
          stroke={action.stroke || "#059669"}
          strokeWidth={action.strokeWidth || 2}
          strokeDasharray={action.strokeDasharray}
          fill={action.fill || "rgba(241, 245, 249, 0.75)"}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            originX: `${action.x + action.width / 2}px`,
            originY: `${action.y + action.height / 2}px`,
          }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer hover:stroke-blue-600 transition-colors" : ""}
        />
      );
    }

    case "drawPath": {
      return (
        <motion.path
          key={action.id}
          id={action.id}
          d={action.path}
          stroke={action.stroke || "#2563eb"}
          strokeWidth={action.strokeWidth || 3}
          fill={action.fill || "none"}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer" : ""}
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
          transition={{ duration: 0.55 }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer" : ""}
        >
          {/* Main shaft line */}
          <motion.line
            x1={action.x1}
            y1={action.y1}
            x2={action.x2}
            y2={action.y2}
            stroke={action.stroke || "#0284c7"}
            strokeWidth={action.strokeWidth || 3}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, ease: "easeInOut" }}
          />
          {/* Arrowhead polygon */}
          <polygon
            points={`${action.x2},${action.y2} ${p1x},${p1y} ${p2x},${p2y}`}
            fill={action.stroke || "#0284c7"}
          />
          {/* Optional Label */}
          {action.label && (
            <g>
              <rect
                x={midX - (action.label.length * 4 + 8)}
                y={midY - 18}
                width={action.label.length * 8 + 16}
                height={20}
                rx={5}
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth={1}
                className="filter drop-shadow-sm"
              />
              <text
                x={midX}
                y={midY - 4}
                fontSize={12}
                fill={action.stroke || "#0284c7"}
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
          rx={6}
          fill={action.color || "rgba(254, 240, 138, 0.45)"}
          stroke={action.color ? action.color.replace(/[\d.]+\)$/, "0.85)") : "rgba(234, 179, 8, 0.6)"}
          strokeWidth={1.5}
          strokeDasharray="4 4"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          onClick={handleInteraction}
          className={hasDetails ? "cursor-pointer" : ""}
        />
      );
    }

    case "addLabel": {
      const estimatedWidth = Math.max(70, action.text.length * 8.5 + 24);
      return (
        <motion.g
          key={action.id}
          id={action.id}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          onClick={handleInteraction}
          className={`group ${hasDetails ? "cursor-pointer" : ""}`}
        >
          <rect
            x={action.x}
            y={action.y - 20}
            width={estimatedWidth}
            height={26}
            rx={13}
            fill={action.bg || "#f8fafc"}
            stroke={isSelected ? "#2563eb" : (action.borderColor || action.color || "#cbd5e1")}
            strokeWidth={isSelected ? 2.5 : 1.5}
            className="filter drop-shadow-sm transition-all group-hover:stroke-blue-500"
          />
          <text
            x={action.x + estimatedWidth / 2}
            y={action.y - 3}
            fontSize={12}
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
