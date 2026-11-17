import { WhiteboardAction } from "@/lib/schemas/lesson-schema";
import { CANVAS, LayoutPalette } from "./palettes";
import { fitText, wrapText } from "./text-utils";
import { SegmentAnalysis, sentencesOf } from "./topic-analysis";

/**
 * Archetype diagram builders.
 *
 * Each builder draws the chapter's own content — the steps, parts, milestones
 * or figures that `analyzeSegment` pulled out of the narration — instead of
 * placeholder boxes. Every builder fills the same panel rectangle so the board
 * composition stays stable while the picture changes per topic.
 */

export interface DiagramContext {
  index: number;
  heading: string;
  /** The spoken text, used when the picture is the explanation itself. */
  narration?: string;
  palette: LayoutPalette;
  analysis: SegmentAnalysis;
}

const PANEL = CANVAS.visual;
const PANEL_RIGHT = PANEL.x + PANEL.width;
const PANEL_BOTTOM = PANEL.y + PANEL.height;
const PANEL_CENTER_X = PANEL.x + PANEL.width / 2;

const INK = "#1b1b1b";
const MUTED_INK = "#575552";

/**
 * A real board is white space with a drawing on it, not nested boxes. Each
 * diagram is introduced by a single small kicker line instead of a frame.
 */
function panelFrame(id: string, palette: LayoutPalette, title: string): WhiteboardAction[] {
  return [
    {
      type: "addText",
      id: `${id}-kicker`,
      text: title,
      x: PANEL.x + 4,
      y: PANEL.y + 18,
      fontSize: 11,
      fill: palette.accent,
      fontWeight: "bold",
      font: "mono",
      textAnchor: "start",
    },
  ];
}

/** Node box with wrapped label, used by several archetypes. */
function nodeBox(options: {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  stroke: string;
  fill: string;
  fontSize?: number;
  details?: string;
}): WhiteboardAction[] {
  const { id, x, y, width, height, label, stroke, fill, fontSize = 12, details } = options;
  const lines = wrapText(label, width - 16, fontSize, 2);
  // An unlabelled box teaches nothing; skip it rather than drawing a blank.
  if (lines.length === 0) return [];
  const centerX = x + width / 2;
  const startY = y + height / 2 - ((lines.length - 1) * (fontSize + 3)) / 2 + fontSize / 3;

  const actions: WhiteboardAction[] = [
    {
      type: "drawRect",
      id,
      x,
      y,
      width,
      height,
      rx: 10,
      stroke,
      strokeWidth: 1.5,
      fill,
      details,
      tooltip: label,
    },
  ];

  lines.forEach((line, li) => {
    actions.push({
      type: "addText",
      id: `${id}-l${li}`,
      text: line,
      x: centerX,
      y: startY + li * (fontSize + 3),
      fontSize,
      fill: INK,
      fontWeight: "bold",
      textAnchor: "middle",
      details,
    });
  });

  return actions;
}

/** Ordered stages left to right, wrapping onto a second row when needed. */
export function buildProcessDiagram(ctx: DiagramContext): WhiteboardAction[] {
  const { index, palette, analysis } = ctx;
  const id = `flow-${index}`;
  const actions = panelFrame(id, palette, "how it works");

  const steps = analysis.steps.slice(0, 4);
  const perRow = steps.length > 2 ? 2 : steps.length;
  const boxWidth = perRow === 2 ? 240 : 300;
  const boxHeight = 62;
  const gapX = 40;
  const rowY = [PANEL.y + 96, PANEL.y + 248];

  steps.forEach((step, si) => {
    const row = Math.floor(si / perRow);
    const col = si % perRow;
    const rowCount = Math.min(perRow, steps.length - row * perRow);
    const rowWidth = rowCount * boxWidth + (rowCount - 1) * gapX;
    const startX = PANEL_CENTER_X - rowWidth / 2;
    const x = startX + col * (boxWidth + gapX);
    const y = rowY[row] ?? rowY[0];

    actions.push(
      ...nodeBox({
        id: `${id}-step-${si}`,
        x,
        y,
        width: boxWidth,
        height: boxHeight,
        label: step,
        stroke: si === steps.length - 1 ? "#059669" : palette.accent,
        fill: si === steps.length - 1 ? "rgba(209, 250, 229, 0.55)" : palette.light,
        details: `Step ${si + 1} of ${steps.length}: ${step}`,
      }),
      {
        type: "addText",
        id: `${id}-num-${si}`,
        text: String(si + 1),
        x: x + 14,
        y: y + 18,
        fontSize: 11,
        fill: palette.accent,
        fontWeight: "bold",
        font: "mono",
        textAnchor: "middle",
      }
    );

    // Connect to the next step: sideways within a row, down between rows.
    if (si < steps.length - 1) {
      const nextCol = (si + 1) % perRow;
      const sameRow = nextCol > col;

      actions.push(
        sameRow
          ? {
              type: "drawArrow",
              id: `${id}-arrow-${si}`,
              x1: x + boxWidth + 6,
              y1: y + boxHeight / 2,
              x2: x + boxWidth + gapX - 6,
              y2: y + boxHeight / 2,
              stroke: palette.accent,
              strokeWidth: 1.8,
            }
          : {
              type: "drawArrow",
              id: `${id}-arrow-${si}`,
              x1: PANEL_CENTER_X,
              y1: y + boxHeight + 6,
              x2: PANEL_CENTER_X,
              y2: rowY[row + 1] - 6,
              stroke: palette.accent,
              strokeWidth: 1.8,
            }
      );
    }
  });

  return actions;
}

/** Stages arranged around a ring to show that the process repeats. */
export function buildCycleDiagram(ctx: DiagramContext): WhiteboardAction[] {
  const { index, palette, analysis } = ctx;
  const id = `cycle-${index}`;
  const actions = panelFrame(id, palette, "a repeating cycle");

  const steps = analysis.steps.slice(0, 4);
  const cx = PANEL_CENTER_X;
  const cy = PANEL.y + 200;
  const radius = 118;
  const boxWidth = 140;
  const boxHeight = 50;

  actions.push({
    type: "drawCircle",
    id: `${id}-ring`,
    cx,
    cy,
    r: radius,
    stroke: palette.accent,
    strokeWidth: 1.2,
    strokeDasharray: "6 7",
    fill: "none",
  });

  actions.push({
    type: "addText",
    id: `${id}-center`,
    text: fitText(analysis.subject, 150, 15),
    x: cx,
    y: cy + 5,
    fontSize: 15,
    fill: palette.accent,
    fontWeight: "bold",
    font: "hand",
    textAnchor: "middle",
  });

  steps.forEach((step, si) => {
    // Start at the top and move clockwise.
    const angle = -Math.PI / 2 + (si * 2 * Math.PI) / Math.max(steps.length, 1);
    const x = cx + Math.cos(angle) * (radius + 46) - boxWidth / 2;
    const y = cy + Math.sin(angle) * (radius + 36) - boxHeight / 2;

    actions.push(
      ...nodeBox({
        id: `${id}-step-${si}`,
        x: Math.max(PANEL.x + 8, Math.min(x, PANEL_RIGHT - boxWidth - 8)),
        y: Math.max(PANEL.y + 36, Math.min(y, PANEL_BOTTOM - boxHeight - 8)),
        width: boxWidth,
        height: boxHeight,
        label: step,
        stroke: palette.accent,
        fill: palette.light,
        fontSize: 11,
        details: `Phase ${si + 1}: ${step}`,
      })
    );
  });

  return actions;
}

/** Two contrasted columns carrying the narration's own points. */
export function buildComparisonDiagram(ctx: DiagramContext): WhiteboardAction[] {
  const { index, palette, analysis } = ctx;
  const id = `cmp-${index}`;
  const actions = panelFrame(id, palette, "side by side");

  const pair = analysis.comparison || {
    leftTitle: "Before",
    rightTitle: "After",
    leftPoints: analysis.keyTerms.slice(0, 2),
    rightPoints: analysis.keyTerms.slice(2, 4),
  };

  const columns = [
    {
      key: "left",
      x: PANEL.x + 18,
      title: pair.leftTitle,
      points: pair.leftPoints,
      color: "#1677ff",
      fill: "rgba(230, 244, 255, 0.6)",
    },
    {
      key: "right",
      x: PANEL.x + 300,
      title: pair.rightTitle,
      points: pair.rightPoints,
      color: "#059669",
      fill: "rgba(209, 250, 229, 0.5)",
    },
  ];

  const colWidth = 262;

  columns.forEach((col) => {
    actions.push(
      {
        type: "drawRect",
        id: `${id}-${col.key}`,
        x: col.x,
        y: PANEL.y + 60,
        width: colWidth,
        height: 300,
        rx: 10,
        stroke: col.color,
        strokeWidth: 1.4,
        fill: col.fill,
      },
      {
        type: "addText",
        id: `${id}-${col.key}-title`,
        text: fitText(col.title, colWidth - 20, 14),
        x: col.x + colWidth / 2,
        y: PANEL.y + 90,
        fontSize: 14,
        fill: col.color,
        fontWeight: "bold",
        textAnchor: "middle",
      }
    );

    let cursorY = PANEL.y + 124;
    col.points.filter(Boolean).forEach((point, pi) => {
      const lines = wrapText(point, colWidth - 34, 11, 3);
      lines.forEach((line, li) => {
        actions.push({
          type: "addText",
          id: `${id}-${col.key}-${pi}-${li}`,
          text: li === 0 ? `• ${line}` : `  ${line}`,
          x: col.x + 14,
          y: cursorY + li * 16,
          fontSize: 11,
          fill: "#2c2a27",
          textAnchor: "start",
          details: point,
        });
      });
      cursorY += lines.length * 16 + 10;
    });
  });

  actions.push({
    type: "drawArrow",
    id: `${id}-bridge`,
    x1: PANEL.x + 280,
    y1: PANEL.y + 210,
    x2: PANEL.x + 296,
    y2: PANEL.y + 210,
    stroke: "#d97706",
    strokeWidth: 2.2,
  });

  return actions;
}

/** A central subject with its named parts radiating from it. */
export function buildPartsDiagram(ctx: DiagramContext): WhiteboardAction[] {
  const { index, palette, analysis } = ctx;
  const id = `parts-${index}`;
  const actions = panelFrame(id, palette, "what it is made of");

  const parts = analysis.parts.slice(0, 4);
  const hubWidth = 170;
  const hubX = PANEL_CENTER_X - hubWidth / 2;
  const hubY = PANEL.y + 72;

  actions.push(
    ...nodeBox({
      id: `${id}-hub`,
      x: hubX,
      y: hubY,
      width: hubWidth,
      height: 50,
      label: analysis.subject,
      stroke: palette.accent,
      fill: palette.bg,
      fontSize: 13,
      details: `${analysis.subject} breaks down into ${parts.length} parts.`,
    })
  );

  const boxWidth = 168;
  const boxHeight = 56;
  const gap = 22;
  const perRow = Math.min(parts.length, 3);
  const rowWidth = perRow * boxWidth + (perRow - 1) * gap;
  const startX = PANEL_CENTER_X - rowWidth / 2;

  parts.forEach((part, pi) => {
    const row = Math.floor(pi / perRow);
    const col = pi % perRow;
    const x = startX + col * (boxWidth + gap);
    const y = PANEL.y + 210 + row * (boxHeight + 30);

    actions.push(
      {
        type: "drawLine",
        id: `${id}-link-${pi}`,
        x1: PANEL_CENTER_X,
        y1: hubY + 50,
        x2: x + boxWidth / 2,
        y2: y,
        stroke: "#b9b4ac",
        strokeWidth: 1,
      },
      ...nodeBox({
        id: `${id}-part-${pi}`,
        x,
        y,
        width: boxWidth,
        height: boxHeight,
        label: part,
        stroke: palette.accent,
        fill: palette.light,
        fontSize: 11,
        details: `${part} is one part of ${analysis.subject}.`,
      })
    );
  });

  return actions;
}

/** Dated milestones along a horizontal axis. */
export function buildTimelineDiagram(ctx: DiagramContext): WhiteboardAction[] {
  const { index, palette, analysis } = ctx;
  const id = `time-${index}`;
  const actions = panelFrame(id, palette, "how it developed");

  const events = analysis.events.slice(0, 4);
  const axisY = PANEL.y + 200;

  actions.push({
    type: "drawLine",
    id: `${id}-axis`,
    x1: PANEL.x + 30,
    y1: axisY,
    x2: PANEL_RIGHT - 30,
    y2: axisY,
    stroke: "#b9b4ac",
    strokeWidth: 2.5,
  });

  const span = PANEL.width - 90;
  const step = events.length > 1 ? span / (events.length - 1) : 0;

  events.forEach((event, ei) => {
    const x = PANEL.x + 45 + ei * step;
    const above = ei % 2 === 0;
    const labelY = above ? axisY - 56 : axisY + 34;

    actions.push(
      {
        type: "drawCircle",
        id: `${id}-node-${ei}`,
        cx: x,
        cy: axisY,
        r: 9,
        stroke: palette.accent,
        strokeWidth: 2,
        fill: "#ffffff",
      },
      {
        type: "addText",
        id: `${id}-year-${ei}`,
        text: event.when,
        x,
        y: above ? axisY - 18 : axisY + 24,
        fontSize: 12,
        fill: palette.accent,
        fontWeight: "bold",
        font: "mono",
        textAnchor: "middle",
      }
    );

    wrapText(event.label, 130, 11, 2).forEach((line, li) => {
      actions.push({
        type: "addText",
        id: `${id}-label-${ei}-${li}`,
        text: line,
        x,
        y: labelY + li * 14,
        fontSize: 11,
        fill: "#2c2a27",
        textAnchor: "middle",
        details: `${event.when}: ${event.label}`,
      });
    });
  });

  return actions;
}

/** Comparative bar chart of the figures quoted in the narration. */
export function buildQuantityDiagram(ctx: DiagramContext): WhiteboardAction[] {
  const { index, palette, analysis } = ctx;
  const id = `qty-${index}`;
  const actions = panelFrame(id, palette, "by the numbers");

  const values = analysis.quantities.slice(0, 4);
  const maxValue = Math.max(...values.map((v) => v.value), 1);

  const baseY = PANEL_BOTTOM - 52;
  const chartHeight = 230;
  const barWidth = 66;
  const gap = 46;
  const totalWidth = values.length * barWidth + (values.length - 1) * gap;
  const startX = PANEL_CENTER_X - totalWidth / 2;

  actions.push({
    type: "drawLine",
    id: `${id}-base`,
    x1: PANEL.x + 24,
    y1: baseY,
    x2: PANEL_RIGHT - 24,
    y2: baseY,
    stroke: "#b9b4ac",
    strokeWidth: 1.5,
  });

  values.forEach((value, vi) => {
    const height = Math.max(18, (value.value / maxValue) * chartHeight);
    const x = startX + vi * (barWidth + gap);
    const y = baseY - height;

    actions.push(
      {
        type: "drawRect",
        id: `${id}-bar-${vi}`,
        x,
        y,
        width: barWidth,
        height,
        rx: 6,
        stroke: palette.accent,
        strokeWidth: 1.4,
        fill: palette.light,
        details: `${value.label}: ${value.value}${value.unit}`,
        tooltip: `${value.value}${value.unit}`,
      },
      {
        type: "addText",
        id: `${id}-val-${vi}`,
        text: `${value.value}${value.unit}`,
        x: x + barWidth / 2,
        y: y - 8,
        fontSize: 11,
        fill: palette.accent,
        fontWeight: "bold",
        font: "mono",
        textAnchor: "middle",
      },
      {
        type: "addText",
        id: `${id}-lbl-${vi}`,
        text: fitText(value.label, barWidth + gap - 6, 10),
        x: x + barWidth / 2,
        y: baseY + 16,
        fontSize: 10,
        fill: MUTED_INK,
        textAnchor: "middle",
      }
    );
  });

  return actions;
}

/**
 * Definition board: what the chapter actually says, written out, with the few
 * terms worth remembering underneath.
 *
 * This is the archetype for chapters with no structural shape, so it must never
 * fall back to repeating the title or drawing empty placeholders.
 */
export function buildConceptDiagram(ctx: DiagramContext): WhiteboardAction[] {
  const { index, palette, analysis, narration = "", heading } = ctx;
  const id = `concept-${index}`;
  const actions = panelFrame(id, palette, "the core idea");

  // Fixed vertical bands: the definition and the chips can never collide,
  // whatever length the sentence turns out to be.
  const DEF_TOP = PANEL.y + 78;
  const LINE_HEIGHT = 32;
  const CHIP_TOP = PANEL.y + 236;

  const lines = wrapText(pickDefinition(narration, analysis, heading), PANEL.width - 70, 22, 3);

  lines.forEach((line, li) => {
    actions.push({
      type: "addText",
      id: `${id}-def-${li}`,
      text: line,
      x: PANEL_CENTER_X,
      y: DEF_TOP + li * LINE_HEIGHT,
      fontSize: 22,
      fill: INK,
      font: "hand",
      textAnchor: "middle",
    });
  });

  actions.push({
    type: "drawLine",
    id: `${id}-underline`,
    x1: PANEL_CENTER_X - 120,
    y1: DEF_TOP + (lines.length - 1) * LINE_HEIGHT + 16,
    x2: PANEL_CENTER_X + 120,
    y2: DEF_TOP + (lines.length - 1) * LINE_HEIGHT + 16,
    stroke: palette.accent,
    strokeWidth: 2,
  });

  // Terms worth keeping, excluding anything already said in the heading.
  const headingLower = heading.toLowerCase();
  const terms = analysis.keyTerms
    .map((term) => term.trim())
    .filter((term) => term.length > 1 && !headingLower.includes(term.toLowerCase()))
    .slice(0, 3);

  if (terms.length >= 2) {
    const chipWidth = 168;
    const gap = 20;
    const rowWidth = terms.length * chipWidth + (terms.length - 1) * gap;
    const startX = PANEL_CENTER_X - rowWidth / 2;

    actions.push({
      type: "addText",
      id: `${id}-terms-kicker`,
      text: "worth remembering",
      x: PANEL_CENTER_X,
      y: CHIP_TOP - 16,
      fontSize: 10,
      fill: MUTED_INK,
      font: "mono",
      textAnchor: "middle",
    });

    terms.forEach((term, ti) => {
      actions.push(
        ...nodeBox({
          id: `${id}-term-${ti}`,
          x: startX + ti * (chipWidth + gap),
          y: CHIP_TOP,
          width: chipWidth,
          height: 46,
          label: term,
          stroke: palette.accent,
          fill: palette.light,
          fontSize: 12,
          details: `${term} is a key term in this chapter.`,
        })
      );
    });
  }

  return actions;
}

/** Conversational openers teach nothing, so the board skips past them. */
const FILLER_OPENER =
  /^(right|ok|okay|alright|so|now|today|first|let's|lets|welcome|in this chapter|we will|we're going to|imagine)/i;

function pickDefinition(
  narration: string,
  analysis: SegmentAnalysis,
  heading: string
): string {
  const sentences = sentencesOf(narration);

  const substantive = sentences.find(
    (sentence) => sentence.length > 30 && !FILLER_OPENER.test(sentence.trim())
  );

  return (
    substantive ||
    sentences.find((sentence) => sentence.length > 25) ||
    analysis.keyTerms.slice(0, 3).join(" · ") ||
    heading
  );
}

const BUILDERS = {
  process: buildProcessDiagram,
  cycle: buildCycleDiagram,
  comparison: buildComparisonDiagram,
  parts: buildPartsDiagram,
  timeline: buildTimelineDiagram,
  quantity: buildQuantityDiagram,
  concept: buildConceptDiagram,
} as const;

/** Draws the archetype that `analyzeSegment` chose for this chapter. */
export function buildTopicDiagram(ctx: DiagramContext): WhiteboardAction[] {
  const builder = BUILDERS[ctx.analysis.archetype] || buildConceptDiagram;
  return builder(ctx);
}
