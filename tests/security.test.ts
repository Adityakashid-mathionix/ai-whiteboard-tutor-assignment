import { describe, expect, it } from "vitest";
import { isAllowedImageUrl, isSafePathData, safePathData } from "@/lib/whiteboard/safe-url";
import { coerceAction } from "@/lib/ai/normalize-lesson";
import { sanitizeWhiteboardAction } from "@/lib/whiteboard/action-validator";

describe("image URL allowlist", () => {
  it("accepts https Wikimedia media", () => {
    expect(
      isAllowedImageUrl("https://upload.wikimedia.org/wikipedia/commons/e/e0/Heart.svg")
    ).toBe(true);
  });

  it("rejects script-bearing and non-https schemes", () => {
    for (const url of [
      "javascript:alert(1)",
      "data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pg==",
      "blob:https://upload.wikimedia.org/abc",
      "http://upload.wikimedia.org/x.png",
      "file:///etc/passwd",
    ]) {
      expect(isAllowedImageUrl(url)).toBe(false);
    }
  });

  it("rejects look-alike and credentialed hosts", () => {
    for (const url of [
      "https://upload.wikimedia.org.evil.com/x.png",
      "https://evil.com/upload.wikimedia.org/x.png",
      "https://user:pass@upload.wikimedia.org/x.png",
      "https://tracker.example.com/pixel.gif",
    ]) {
      expect(isAllowedImageUrl(url)).toBe(false);
    }
  });

  it("drops a disallowed image action during normalisation", () => {
    const action = coerceAction(
      { type: "drawImage", url: "https://evil.example/x.png", x: 10, y: 10 },
      0,
      0,
      "Chapter"
    );
    expect(action).toBeNull();
  });
});

describe("SVG path sanitisation", () => {
  it("accepts ordinary path data", () => {
    expect(isSafePathData("M 10 10 L 90 90 C 1,2 3,4 5,6 Z")).toBe(true);
  });

  it("rejects anything outside the path grammar", () => {
    for (const path of [
      'M0 0" onload="alert(1)',
      "url(#evil)",
      "M 0 0 <script>",
      "expression(alert(1))",
    ]) {
      expect(isSafePathData(path)).toBe(false);
      expect(safePathData(path)).toBe("M 0 0");
    }
  });

  it("neutralises a hostile path in the validator", () => {
    const sanitized = sanitizeWhiteboardAction({
      type: "drawPath",
      id: "p1",
      path: 'M0 0" onload="alert(1)',
    });
    expect((sanitized as { path: string }).path).toBe("M 0 0");
  });
});

describe("text sanitisation", () => {
  it("strips angle brackets from board text", () => {
    const sanitized = sanitizeWhiteboardAction({
      type: "addText",
      id: "t1",
      text: "<script>alert(1)</script>",
      x: 100,
      y: 100,
    });
    expect((sanitized as { text: string }).text).not.toContain("<");
    expect((sanitized as { text: string }).text).not.toContain(">");
  });

  it("clamps out-of-bounds coordinates onto the board", () => {
    const sanitized = sanitizeWhiteboardAction({
      type: "drawRect",
      id: "r1",
      x: -500,
      y: 9999,
      width: 50_000,
      height: 50_000,
    });
    const rect = sanitized as { x: number; y: number; width: number; height: number };
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeLessThanOrEqual(600);
    expect(rect.width).toBeLessThanOrEqual(1000);
  });
});
