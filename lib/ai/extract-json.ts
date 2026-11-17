/**
 * Pulls the lesson JSON out of a chat completion.
 *
 * Models wrap JSON in prose, in ```json fences, or emit it after a reasoning
 * preamble, so every plausible candidate is parsed and the first one that looks
 * like a lesson wins. Returns the raw input unchanged when nothing parses, so
 * the caller's JSON.parse produces the real error message.
 */

function looksLikeLesson(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return Boolean(record.title || record.segments || record.chapters);
}

function tryParse(candidate: string): boolean {
  try {
    return looksLikeLesson(JSON.parse(candidate));
  } catch {
    return false;
  }
}

export function extractJSON(content: string): string {
  const cleaned = content.trim();

  // 1. Fenced code blocks, last one first: models often retry inside one reply.
  const fencedBlocks: string[] = [];
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
  let match: RegExpExecArray | null;
  while ((match = fenceRegex.exec(cleaned)) !== null) {
    if (match[1]) fencedBlocks.push(match[1].trim());
  }

  for (let i = fencedBlocks.length - 1; i >= 0; i--) {
    if (tryParse(fencedBlocks[i])) return fencedBlocks[i];
  }

  // 2. Widest brace span that parses into something lesson-shaped.
  const lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace !== -1) {
    let searchPos = 0;
    while (searchPos < lastBrace) {
      const startBrace = cleaned.indexOf("{", searchPos);
      if (startBrace === -1) break;

      const candidate = cleaned.substring(startBrace, lastBrace + 1);
      if (tryParse(candidate)) return candidate;

      searchPos = startBrace + 1;
    }
  }

  // 3. Salvage a truncated reply: close whatever is still open so the chapters
  //    that did arrive are usable instead of failing the whole generation.
  const repaired = repairTruncatedJSON(cleaned);
  if (repaired && tryParse(repaired)) return repaired;

  return cleaned;
}

/**
 * Closes unterminated strings, arrays and objects in a cut-off JSON document,
 * dropping the final incomplete element.
 */
export function repairTruncatedJSON(input: string): string | null {
  const start = input.indexOf("{");
  if (start === -1) return null;

  let text = input.slice(start);

  // Walk the document tracking structure, remembering the last position where
  // the document was syntactically complete enough to close cleanly.
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let lastSafe = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") stack.pop();
    else if (ch === "," && stack.length > 0) lastSafe = i;
  }

  // Cut back to the last element boundary when we ended mid-value.
  if (inString || stack.length > 0) {
    if (lastSafe > 0) text = text.slice(0, lastSafe);
  }

  // Recompute the open structures for the trimmed text.
  const open: string[] = [];
  inString = false;
  escaped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{" || ch === "[") open.push(ch);
    else if (ch === "}" || ch === "]") open.pop();
  }

  if (inString) text += '"';
  while (open.length > 0) {
    text += open.pop() === "{" ? "}" : "]";
  }

  return text;
}
