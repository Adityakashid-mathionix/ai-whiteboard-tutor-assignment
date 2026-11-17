import { WhiteboardAction } from "@/lib/schemas/lesson-schema";
import { EducationalVisualAsset } from "@/lib/visuals/visual-attribution";
import { CANVAS, LayoutPalette, paletteForIndex } from "./palettes";
import { buildTopicDiagram } from "./diagrams";
import { analysisFromHint, analyzeSegment, SegmentAnalysis } from "./topic-analysis";
import { fitText, splitSentences, wrapText } from "./text-utils";

export interface SegmentLayoutInput {
  index: number;
  heading: string;
  narration: string;
  keyTakeaway: string;
  topic?: string;
  /** The model's own diagram brief for this chapter, when it supplied one. */
  visualHint?: Record<string, unknown> | null;
  /** Image actions the model supplied, if any. */
  modelImageActions: WhiteboardAction[];
  /** Real educational assets retrieved for the topic. */
  visualAssets: EducationalVisualAsset[];
}

const PANEL = CANVAS.visual;
const NOTES = CANVAS.notes;
const FOOTER = CANVAS.footer;
const NOTES_TEXT_WIDTH = NOTES.width - 34;

/**
 * Chapter header: a handwritten title across the top of the board with the
 * chapter number tucked to the left, the way a teacher titles a fresh board.
 */
export function buildHeaderActions(
  index: number,
  heading: string,
  palette: LayoutPalette
): WhiteboardAction[] {
  return [
    {
      type: "addLabel",
      id: `ch-badge-${index}`,
      text: `Chapter ${index + 1}`,
      x: CANVAS.visual.x,
      y: CANVAS.header.baseline + 6,
      color: palette.accent,
      bg: palette.bg,
      borderColor: palette.accent,
    },
    {
      type: "addText",
      id: `hdr-${index}`,
      text: fitText(heading, 620, 30),
      x: CANVAS.centerX,
      y: CANVAS.header.baseline + 6,
      fontSize: 30,
      fill: "#1b1b1b",
      fontWeight: "bold",
      font: "hand",
      textAnchor: "middle",
      details: `Chapter ${index + 1}: ${heading}`,
    },
    {
      type: "drawLine",
      id: `hdr-line-${index}`,
      x1: CANVAS.visual.x,
      y1: CANVAS.header.ruleY,
      x2: NOTES.x + NOTES.width,
      y2: CANVAS.header.ruleY,
      stroke: palette.accent,
      strokeWidth: 1.4,
    },
  ];
}

/** Left panel: a real photograph when one exists, otherwise a drawn diagram. */
export function buildVisualPanel(
  input: SegmentLayoutInput,
  palette: LayoutPalette,
  analysis: SegmentAnalysis
): WhiteboardAction[] {
  const { index, heading, modelImageActions, visualAssets } = input;

  if (modelImageActions.length > 0) {
    return modelImageActions;
  }

  // A photograph is worth showing once, to anchor the subject. Every later
  // chapter gets its own drawn diagram, because repeating the same stock image
  // beside different explanations teaches nothing.
  if (index === 0 && visualAssets[0]?.curated) {
    const asset = visualAssets[0];
    const imageWidth = PANEL.width - 40;
    const imageHeight = PANEL.height - 70;

    return [
      {
        type: "drawRect",
        id: `img-frame-${index}`,
        x: PANEL.x,
        y: PANEL.y,
        width: PANEL.width,
        height: PANEL.height,
        rx: 14,
        stroke: palette.accent,
        strokeWidth: 1.4,
        fill: "rgba(252, 250, 246, 0.9)",
      },
      {
        type: "drawImage",
        id: `img-${index}`,
        url: asset.url,
        x: PANEL.x + 20,
        y: PANEL.y + 34,
        width: imageWidth,
        height: imageHeight,
        caption: fitText(asset.title, imageWidth - 40, 11),
        attribution: asset.attribution.author,
        license: asset.attribution.license,
        details: asset.description || asset.title,
      },
      {
        type: "addText",
        id: `img-kicker-${index}`,
        text: "ON THE BOARD",
        x: PANEL.x + 20,
        y: PANEL.y + 24,
        fontSize: 11,
        fill: palette.accent,
        fontWeight: "bold",
        font: "mono",
        textAnchor: "start",
      },
    ];
  }

  return buildTopicDiagram({ index, heading, narration: input.narration, palette, analysis });
}

/** Right column: the spoken points, written up as a teacher's board notes. */
export function buildNotesCard(
  input: SegmentLayoutInput,
  palette: LayoutPalette,
  analysis: SegmentAnalysis
): WhiteboardAction[] {
  const { index, narration } = input;

  const actions: WhiteboardAction[] = [
    {
      type: "drawLine",
      id: `card-rule-${index}`,
      x1: NOTES.x - 22,
      y1: NOTES.y,
      x2: NOTES.x - 22,
      y2: NOTES.y + NOTES.height,
      stroke: "#e0ddda",
      strokeWidth: 1,
    },
    {
      type: "addText",
      id: `card-kicker-${index}`,
      text: "notes",
      x: NOTES.x,
      y: NOTES.y + 18,
      fontSize: 11,
      fill: palette.accent,
      fontWeight: "bold",
      font: "mono",
      textAnchor: "start",
    },
  ];

  // Each spoken sentence becomes one wrapped, numbered note.
  const sentences = splitSentences(narration).slice(0, 4);
  let cursorY = NOTES.y + 46;

  sentences.forEach((sentence, si) => {
    const lines = wrapText(sentence, NOTES_TEXT_WIDTH - 16, 12, 3);

    lines.forEach((line, li) => {
      actions.push({
        type: "addText",
        id: `bul-${index}-${si}-${li}`,
        text: li === 0 ? `${si + 1}. ${line}` : `   ${line}`,
        x: NOTES.x,
        y: cursorY + li * 17,
        fontSize: 12,
        fill: "#2c2a27",
        textAnchor: "start",
        details: sentence,
      });
    });

    cursorY += lines.length * 17 + 12;
  });

  // Terms worth remembering, pinned under the notes.
  const terms = analysis.keyTerms.slice(0, 3);
  if (terms.length > 0 && cursorY < NOTES.y + NOTES.height - 70) {
    actions.push({
      type: "addText",
      id: `terms-kicker-${index}`,
      text: "KEY TERMS",
      x: NOTES.x,
      y: cursorY + 8,
      fontSize: 10,
      fill: palette.accent,
      fontWeight: "bold",
      font: "mono",
      textAnchor: "start",
    });

    terms.forEach((term, ti) => {
      actions.push({
        type: "addText",
        id: `term-${index}-${ti}`,
        text: fitText(`· ${term}`, NOTES_TEXT_WIDTH, 12),
        x: NOTES.x,
        y: cursorY + 28 + ti * 18,
        fontSize: 12,
        fill: "#2c2a27",
        font: "hand",
        textAnchor: "start",
        details: term,
      });
    });
  }

  return actions;
}

/** Full-width takeaway strip along the bottom, like a highlighted margin note. */
export function buildTakeawayStrip(
  index: number,
  keyTakeaway: string
): WhiteboardAction[] {
  if (!keyTakeaway.trim()) return [];

  const width = NOTES.x + NOTES.width - PANEL.x;
  const text = fitText(keyTakeaway, width - 150, 18);

  return [
    // A highlighter swipe reads as a teacher underlining the point, where a
    // filled box would just add another rectangle to the board.
    {
      type: "highlight",
      id: `tk-mark-${index}`,
      x: PANEL.x + 96,
      y: FOOTER.y + 16,
      width: Math.min(width - 96, text.length * 9 + 24),
      height: 26,
      color: "rgba(255, 221, 102, 0.5)",
    },
    {
      type: "addText",
      id: `tk-kicker-${index}`,
      text: "takeaway",
      x: PANEL.x,
      y: FOOTER.y + 34,
      fontSize: 11,
      fill: "#92400e",
      fontWeight: "bold",
      font: "mono",
      textAnchor: "start",
    },
    {
      type: "addText",
      id: `tk-txt-${index}`,
      text,
      x: PANEL.x + 108,
      y: FOOTER.y + 36,
      fontSize: 18,
      fill: "#4a2d05",
      font: "hand",
      textAnchor: "start",
      details: keyTakeaway,
    },
  ];
}

/**
 * Composes the full board for one chapter: a cleared surface, a handwritten
 * title, a topic-appropriate diagram, the spoken notes, and the takeaway.
 *
 * Starting from `clear` means cumulative replay of earlier chapters can never
 * leave stale elements showing behind the current one.
 */
export function composeSegmentLayout(input: SegmentLayoutInput): WhiteboardAction[] {
  const palette = paletteForIndex(input.index);

  const derived = analyzeSegment({
    heading: input.heading,
    narration: input.narration,
    keyTakeaway: input.keyTakeaway,
    topic: input.topic,
  });

  const analysis = input.visualHint
    ? analysisFromHint(input.visualHint as Parameters<typeof analysisFromHint>[0], derived)
    : derived;

  return [
    { type: "clear" },
    ...buildHeaderActions(input.index, input.heading, palette),
    ...buildVisualPanel(input, palette, analysis),
    ...buildNotesCard(input, palette, analysis),
    ...buildTakeawayStrip(input.index, input.keyTakeaway),
  ];
}
