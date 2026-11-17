/**
 * Text measurement and splitting helpers for the SVG whiteboard.
 *
 * SVG <text> does not wrap, so every string placed on the board has to be
 * measured and either truncated or split into explicit lines before rendering.
 */

/** Average glyph width as a fraction of the font size for the UI sans stack. */
const AVG_GLYPH_RATIO = 0.54;

/** Rough pixel width of a string at a given font size. */
export function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * AVG_GLYPH_RATIO;
}

/** Maximum characters that fit in `maxWidth` pixels at `fontSize`. */
export function maxCharsForWidth(maxWidth: number, fontSize: number): number {
  return Math.max(4, Math.floor(maxWidth / (fontSize * AVG_GLYPH_RATIO)));
}

/**
 * Truncates `text` so it fits inside `maxWidth` pixels, adding an ellipsis when
 * characters had to be dropped. Never breaks mid-word unless the first word is
 * itself too long.
 */
export function fitText(text: string, maxWidth: number, fontSize: number): string {
  const clean = text.trim().replace(/^[^\p{L}\p{N}]+/u, "");
  const limit = maxCharsForWidth(maxWidth, fontSize);

  if (clean.length <= limit) return clean;

  const hardCut = clean.slice(0, limit - 1);
  const lastSpace = hardCut.lastIndexOf(" ");
  const body = lastSpace > limit * 0.5 ? hardCut.slice(0, lastSpace) : hardCut;
  return `${body.trimEnd()}…`;
}

/**
 * Wraps `text` into at most `maxLines` lines that each fit `maxWidth` pixels.
 * The final line is ellipsised if content remains.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const limit = maxCharsForWidth(maxWidth, fontSize);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= limit) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;

    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  const consumed = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (consumed < words.length && lines.length > 0) {
    const lastIdx = lines.length - 1;
    lines[lastIdx] = fitText(`${lines[lastIdx]} …`, maxWidth, fontSize);
  }

  return lines.slice(0, maxLines);
}

/** Splits narration prose into usable sentences. */
export function splitSentences(narration: string): string[] {
  return narration
    .replace(/([.?!])\s+(?=[\p{Lu}\p{Lo}])/gu, "$1|")
    .split("|")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter((s) => s.length > 12);
}

/**
 * Derives the bullet points shown on the notes card from the narration,
 * falling back to generic-but-topical lines when the narration is too short.
 */
export function deriveBullets(
  narration: string,
  heading: string,
  keyTakeaway: string,
  maxWidth: number,
  fontSize: number
): string[] {
  const sentences = splitSentences(narration);
  const candidates = [
    sentences[0],
    sentences[1] || keyTakeaway,
    sentences[2],
    sentences[3],
  ];

  const bullets = candidates
    .filter((s): s is string => Boolean(s && s.trim()))
    .map((s) => fitText(s, maxWidth, fontSize));

  if (bullets.length === 0) {
    return [fitText(`${heading}: core principle`, maxWidth, fontSize)];
  }

  return bullets;
}
