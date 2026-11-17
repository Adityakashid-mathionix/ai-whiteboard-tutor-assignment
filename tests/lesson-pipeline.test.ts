import { describe, expect, it, beforeEach } from "vitest";
import { extractJSON } from "@/lib/ai/extract-json";
import { normalizeLessonJson, coerceAction } from "@/lib/ai/normalize-lesson";
import { LessonSchema } from "@/lib/schemas/lesson-schema";
import { globalLessonCache } from "@/lib/cache/lesson-cache";
import { CircuitBreaker } from "@/lib/ai/circuit-breaker";
import { AIProviderError, isFatalAIError } from "@/lib/ai/errors";
import { checkRateLimit, resetRateLimits } from "@/lib/rate-limit";
import { fitText, wrapText } from "@/lib/whiteboard/layout/text-utils";

const LESSON = {
  title: "Test lesson",
  topic: "testing",
  summary: "A lesson used by the test-suite.",
  segments: [
    {
      heading: "Chapter one",
      narration:
        "First the client sends a request. Then the server answers with data. Finally the page renders.",
      keyTakeaway: "Requests go out and responses come back.",
    },
    {
      heading: "Chapter two",
      narration:
        "A response consists of a status code, a set of headers and a body. The browser reads all three.",
      keyTakeaway: "Every response carries a status, headers and a body.",
    },
  ],
};

describe("extractJSON", () => {
  it("pulls JSON out of a fenced block", () => {
    const raw = 'Sure!\n```json\n{"title":"X","segments":[]}\n```\nHope that helps.';
    expect(JSON.parse(extractJSON(raw)).title).toBe("X");
  });

  it("prefers the last lesson-shaped block when the model retries", () => {
    const raw = '```json\n{"nope":1}\n```\n```json\n{"title":"Second","segments":[]}\n```';
    expect(JSON.parse(extractJSON(raw)).title).toBe("Second");
  });

  it("finds bare JSON surrounded by prose", () => {
    const raw = 'Here you go: {"title":"Bare","segments":[]} — enjoy.';
    expect(JSON.parse(extractJSON(raw)).title).toBe("Bare");
  });
});

describe("normalizeLessonJson", () => {
  it("produces a schema-valid lesson from minimal input", () => {
    const lesson = normalizeLessonJson(LESSON, { topic: "testing" });
    expect(() => LessonSchema.parse(lesson)).not.toThrow();
  });

  it("keeps every drawn element inside the 1000x600 board", () => {
    const lesson = normalizeLessonJson(LESSON, { topic: "testing" });

    for (const action of lesson.segments[0].visualActions) {
      const rec = action as unknown as Record<string, number | undefined>;
      for (const key of ["x", "x1", "x2", "cx"]) {
        if (typeof rec[key] === "number") {
          expect(rec[key]).toBeGreaterThanOrEqual(0);
          expect(rec[key]).toBeLessThanOrEqual(1000);
        }
      }
      for (const key of ["y", "y1", "y2", "cy"]) {
        if (typeof rec[key] === "number") {
          expect(rec[key]).toBeGreaterThanOrEqual(0);
          expect(rec[key]).toBeLessThanOrEqual(600);
        }
      }
    }
  });

  it("centres the chapter heading instead of left-anchoring it at x=500", () => {
    const lesson = normalizeLessonJson(LESSON, { topic: "testing" });
    const heading = lesson.segments[0].visualActions.find(
      (a) => a.type === "addText" && a.id?.startsWith("hdr-")
    );

    expect(heading).toBeDefined();
    expect((heading as { textAnchor?: string }).textAnchor).toBe("middle");
  });

  it("carries the requested depth onto the lesson", () => {
    const lesson = normalizeLessonJson(LESSON, { topic: "testing", level: "advanced" });
    expect(lesson.learningLevel).toBe("advanced");
  });
});

describe("coerceAction", () => {
  it("maps loose aliases onto real action types", () => {
    expect(coerceAction({ type: "text", text: "hi", x: 10, y: 10 }, 0, 0, "H")?.type).toBe("addText");
    expect(coerceAction({ type: "rect", x: 1, y: 1 }, 0, 0, "H")?.type).toBe("drawRect");
  });

  it("drops images without a usable URL", () => {
    expect(coerceAction({ type: "drawImage", url: "not-a-url" }, 0, 0, "H")).toBeNull();
  });

  it("forces readable ink for near-white text", () => {
    const action = coerceAction({ type: "addText", text: "x", fill: "#ffffff" }, 0, 0, "H");
    expect((action as { fill?: string }).fill).toBe("#1b1b1b");
  });
});

describe("text fitting", () => {
  it("truncates to the available width", () => {
    const text = fitText("a".repeat(400), 120, 12);
    expect(text.length).toBeLessThan(40);
    expect(text.endsWith("…")).toBe(true);
  });

  it("wraps into the requested number of lines", () => {
    const lines = wrapText("one two three four five six seven eight nine ten", 90, 12, 3);
    expect(lines.length).toBeLessThanOrEqual(3);
  });
});

describe("lesson cache", () => {
  beforeEach(() => globalLessonCache.clear());

  it("separates entries by model and level", () => {
    const a = globalLessonCache.buildKey({ topic: "Rabies", level: "beginner" });
    const b = globalLessonCache.buildKey({ topic: "Rabies", level: "advanced" });
    const c = globalLessonCache.buildKey({ topic: "What is rabies?", level: "beginner" });

    expect(a).not.toBe(b);
    expect(a).toBe(c); // same question, normalised
  });

  it("never stores a fallback lesson", async () => {
    const lesson = normalizeLessonJson(LESSON, { topic: "testing" });

    await globalLessonCache.getOrGenerate({ topic: "testing" }, async () => ({
      lesson,
      source: "fallback",
    }));

    expect(globalLessonCache.get({ topic: "testing" })).toBeNull();
  });

  it("stores and replays an AI lesson", async () => {
    const lesson = normalizeLessonJson(LESSON, { topic: "testing" });

    await globalLessonCache.getOrGenerate({ topic: "testing" }, async () => ({
      lesson,
      source: "ai",
    }));

    const second = await globalLessonCache.getOrGenerate({ topic: "testing" }, async () => {
      throw new Error("generator should not run on a cache hit");
    });

    expect(second.source).toBe("cache");
  });
});

describe("circuit breaker", () => {
  it("rethrows fatal errors instead of masking them with a fallback", async () => {
    const breaker = new CircuitBreaker();
    const authError = new AIProviderError("auth", "missing key");

    await expect(
      breaker.execute(
        async () => {
          throw authError;
        },
        async () => "fallback",
        { shouldFallback: (e) => !isFatalAIError(e) }
      )
    ).rejects.toThrow("missing key");
  });

  it("falls back for transient upstream failures", async () => {
    const breaker = new CircuitBreaker();

    const result = await breaker.execute(
      async () => {
        throw new AIProviderError("upstream", "502 from provider");
      },
      async () => "fallback",
      { shouldFallback: (e) => !isFatalAIError(e) }
    );

    expect(result).toBe("fallback");
  });
});

describe("rate limit", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit then blocks", () => {
    const rule = { limit: 2, windowMs: 60_000 };
    expect(checkRateLimit("ip", rule).allowed).toBe(true);
    expect(checkRateLimit("ip", rule).allowed).toBe(true);
    expect(checkRateLimit("ip", rule).allowed).toBe(false);
  });

  it("keeps separate callers independent", () => {
    const rule = { limit: 1, windowMs: 60_000 };
    expect(checkRateLimit("a", rule).allowed).toBe(true);
    expect(checkRateLimit("b", rule).allowed).toBe(true);
  });
});
