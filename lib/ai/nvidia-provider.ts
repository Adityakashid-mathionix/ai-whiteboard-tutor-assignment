import { AIProvider, AIProviderOptions, LessonContext } from "./provider";
import { Lesson, LessonSchema } from "@/lib/schemas/lesson-schema";
import { LESSON_SYSTEM_PROMPT, FOLLOWUP_SYSTEM_PROMPT } from "./prompts";

export class NvidiaNIMProvider implements AIProvider {
  name = "NVIDIA NIM (Hosted Inference)";

  private getApiKey(options?: AIProviderOptions): string {
    const key = options?.apiKey || process.env.NVIDIA_API_KEY;
    if (!key || key.trim() === "") {
      throw new Error(
        "NVIDIA API Key is missing. Please set NVIDIA_API_KEY in your .env.local or enter your key in the Studio settings."
      );
    }
    return key.trim();
  }

  private getModel(options?: AIProviderOptions): string {
    return (
      options?.model ||
      process.env.NVIDIA_MODEL ||
      "nvidia/nemotron-3.5-lightning-30b-a3b"
    );
  }

  private getBaseUrl(options?: AIProviderOptions): string {
    return (
      options?.baseUrl ||
      process.env.NVIDIA_BASE_URL ||
      "https://integrate.api.nvidia.com/v1"
    );
  }

  /**
   * Helper to clean markdown JSON wrappers from LLM output with validated parse testing
   */
  private extractJSON(content: string): string {
    const cleaned = content.trim();

    // 1. Check all markdown code blocks from last to first
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    let match: RegExpExecArray | null;
    const blocks: string[] = [];
    while ((match = jsonBlockRegex.exec(cleaned)) !== null) {
      if (match[1]) {
        blocks.push(match[1].trim());
      }
    }

    for (let i = blocks.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(blocks[i]);
        if (parsed && typeof parsed === "object" && (parsed.title || parsed.segments)) {
          return blocks[i];
        }
      } catch {}
    }

    // 2. Scan for valid JSON object by searching balanced braces from end
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace !== -1) {
      let searchPos = 0;
      while (searchPos < lastBrace) {
        const startBrace = cleaned.indexOf("{", searchPos);
        if (startBrace === -1) break;
        const candidate = cleaned.substring(startBrace, lastBrace + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (parsed && typeof parsed === "object" && (parsed.title || parsed.segments)) {
            return candidate;
          }
        } catch {}
        searchPos = startBrace + 1;
      }
    }

    return cleaned;
  }

  async generateLesson(
    topic: string,
    options?: AIProviderOptions
  ): Promise<Lesson> {
    const apiKey = this.getApiKey(options);
    const model = this.getModel(options);
    const baseUrl = this.getBaseUrl(options);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: LESSON_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: `Please create a complete 2-minute whiteboard educational lesson on the topic: "${topic.trim()}". Return the response strictly as valid JSON adhering to the whiteboard schema.`,
            },
          ],
          temperature: 0.2,
          max_tokens: 3500,
          chat_template_kwargs: { thinking: false },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorDetail = "";
        try {
          const errJson = await response.json();
          errorDetail = errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errorDetail = await response.text();
        }

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            `Authentication failed with NVIDIA NIM: ${errorDetail || "Invalid API key"}. Please check your credentials.`
          );
        } else if (response.status === 429) {
          throw new Error(
            "NVIDIA NIM rate limit exceeded. Please wait a moment before requesting another lesson."
          );
        } else {
          throw new Error(
            `NVIDIA NIM API error (${response.status}): ${errorDetail || "Unknown error"}`
          );
        }
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      let jsonStr = "";

      if (rawContent && rawContent.trim().length > 0) {
        jsonStr = this.extractJSON(rawContent);
      } else {
        const reasoning = data.choices?.[0]?.message?.reasoning_content;
        if (reasoning && reasoning.trim().length > 0) {
          jsonStr = this.extractJSON(reasoning);
        }
      }

      if (!jsonStr || jsonStr.trim().length === 0) {
        throw new Error("Received empty response from NVIDIA NIM.");
      }
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(jsonStr);
      } catch (parseErr) {
        throw new Error(
          `Failed to parse AI output as JSON: ${(parseErr as Error).message}. Raw response was: ${(rawContent || jsonStr).substring(0, 200)}...`
        );
      }

      // Normalize potential LLM key aliases (e.g. title -> heading, content -> narration)
      const normalized = normalizeLessonJson(parsedJson, topic);

      // Validate with Zod
      const validatedLesson = LessonSchema.parse(normalized);
      return validatedLesson;
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error(
          "Request to NVIDIA NIM timed out after 60 seconds. The server might be experiencing high load."
        );
      }
      throw err;
    }
  }

  async askQuestion(
    question: string,
    context: LessonContext,
    options?: AIProviderOptions
  ): Promise<string> {
    const apiKey = this.getApiKey(options);
    const model = this.getModel(options);
    const baseUrl = this.getBaseUrl(options);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const lessonSummary = `
Topic: ${context.topic}
Lesson Title: ${context.lesson.title}
Overview: ${context.lesson.summary}
Segments Taught:
${context.lesson.segments
  .map(
    (s, idx) =>
      `${idx + 1}. ${s.heading}: ${s.narration} (Key Takeaway: ${s.keyTakeaway})`
  )
  .join("\n")}
    `.trim();

    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [
      {
        role: "system",
        content: `${FOLLOWUP_SYSTEM_PROMPT}\n\n[LESSON CONTEXT]\n${lessonSummary}`,
      },
    ];

    // Include recent history
    context.history.slice(-6).forEach((msg) => {
      messages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    });

    messages.push({
      role: "user",
      content: question,
    });

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.4,
          max_tokens: 1024,
          chat_template_kwargs: { thinking: false },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorDetail = "";
        try {
          const errJson = await response.json();
          errorDetail = errJson.error?.message || JSON.stringify(errJson);
        } catch {
          errorDetail = await response.text();
        }
        throw new Error(
          `NVIDIA NIM API error (${response.status}): ${errorDetail || "Unknown error"}`
        );
      }

      const data = await response.json();
      const answer =
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.message?.reasoning_content;
      if (!answer) {
        throw new Error("No response generated by NVIDIA NIM for your question.");
      }

      return answer.trim();
    } catch (err: unknown) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("Follow-up question request timed out after 45 seconds.");
      }
      throw err;
    }
  }
}

function normalizeLessonJson(raw: any, topic: string) {
  if (!raw || typeof raw !== "object") return raw;

  const title = raw.title || raw.lessonTitle || topic;
  const summary =
    raw.summary ||
    raw.overview ||
    raw.description ||
    `Educational lesson explaining ${topic}.`;
  const estimatedDuration = Number(raw.estimatedDuration) || 120;

  const rawSegments = Array.isArray(raw.segments)
    ? raw.segments
    : Array.isArray(raw.chapters)
    ? raw.chapters
    : [];

  const segments = rawSegments.map((seg: any, idx: number) => {
    const heading =
      seg.heading || seg.title || seg.chapter || `Chapter ${idx + 1}`;
    const narration =
      seg.narration ||
      seg.content ||
      seg.explanation ||
      seg.text ||
      `In this chapter, we explore ${heading}.`;
    const keyTakeaway =
      seg.keyTakeaway || seg.objective || seg.takeaway || seg.summary || "";

    const rawActions = Array.isArray(seg.visualActions)
      ? seg.visualActions
      : Array.isArray(seg.drawActions)
      ? seg.drawActions
      : [];
    let visualActions: any[] = [];
    const validTypes = [
      "addText",
      "drawLine",
      "drawCircle",
      "drawRect",
      "drawPath",
      "drawArrow",
      "highlight",
      "addLabel",
      "erase",
      "clear",
    ];

    if (rawActions.length > 0) {
      visualActions = rawActions.map((act: any, aIdx: number) => {
        let type = String(act.type || "addText").trim();
        if (type === "text") type = "addText";
        else if (type === "circle") type = "drawCircle";
        else if (type === "line") type = "drawLine";
        else if (type === "arrow") type = "drawArrow";
        else if (type === "rect" || type === "rectangle") type = "drawRect";
        else if (type === "path") type = "drawPath";
        else if (type === "label") type = "addLabel";

        if (!validTypes.includes(type)) {
          if (act.text) type = "addText";
          else if (act.cx !== undefined) type = "drawCircle";
          else if (act.x1 !== undefined && act.x2 !== undefined) type = "drawLine";
          else type = "drawRect";
        }

        // Guarantee required numeric fields for specific types
        if (type === "addText") {
          return {
            type: "addText",
            id: act.id || `act-txt-${idx}-${aIdx}`,
            text: String(act.text || heading),
            x: Number(act.x) || 500,
            y: Number(act.y) || 80,
            fontSize: Number(act.fontSize) || 18,
            fill: act.fill || "#f8fafc",
            fontWeight: act.fontWeight || "normal",
          };
        } else if (type === "drawCircle") {
          return {
            type: "drawCircle",
            id: act.id || `act-circ-${idx}-${aIdx}`,
            cx: Number(act.cx) || 400,
            cy: Number(act.cy) || 300,
            r: Number(act.r) || 50,
            stroke: act.stroke || "#38bdf8",
            strokeWidth: Number(act.strokeWidth) || 3,
            fill: act.fill || "none",
          };
        } else if (type === "drawRect") {
          return {
            type: "drawRect",
            id: act.id || `act-rect-${idx}-${aIdx}`,
            x: Number(act.x) || 300,
            y: Number(act.y) || 200,
            width: Number(act.width) || 200,
            height: Number(act.height) || 120,
            rx: Number(act.rx) || 10,
            stroke: act.stroke || "#34d399",
            strokeWidth: Number(act.strokeWidth) || 2,
            fill: act.fill || "rgba(30, 41, 59, 0.4)",
          };
        } else if (type === "drawLine") {
          return {
            type: "drawLine",
            id: act.id || `act-line-${idx}-${aIdx}`,
            x1: Number(act.x1) || 200,
            y1: Number(act.y1) || 300,
            x2: Number(act.x2) || 450,
            y2: Number(act.y2) || 300,
            stroke: act.stroke || "#60a5fa",
            strokeWidth: Number(act.strokeWidth) || 3,
          };
        } else if (type === "drawArrow") {
          return {
            type: "drawArrow",
            id: act.id || `act-arrow-${idx}-${aIdx}`,
            x1: Number(act.x1) || 300,
            y1: Number(act.y1) || 300,
            x2: Number(act.x2) || 500,
            y2: Number(act.y2) || 300,
            stroke: act.stroke || "#fbbf24",
            strokeWidth: Number(act.strokeWidth) || 3,
            label: act.label,
          };
        }

        return {
          ...act,
          id: act.id || `act-${idx}-${aIdx}`,
          type,
        };
      });
    }

    if (visualActions.length === 0) {
      visualActions = [
        {
          type: "addText",
          id: `txt-${idx}-title`,
          text: heading,
          x: 500,
          y: 80,
          fontSize: 22,
          fill: "#f8fafc",
          fontWeight: "bold",
        },
        {
          type: "drawRect",
          id: `rect-${idx}`,
          x: 200 + (idx % 2) * 50,
          y: 180,
          width: 500,
          height: 240,
          rx: 16,
          stroke: idx % 2 === 0 ? "#38bdf8" : "#818cf8",
          strokeWidth: 3,
          fill:
            idx % 2 === 0
              ? "rgba(56, 189, 248, 0.12)"
              : "rgba(129, 140, 248, 0.12)",
        },
        {
          type: "addLabel",
          id: `lbl-${idx}`,
          text: `Key Concept: ${heading.substring(0, 25)}`,
          x: 450,
          y: 450,
          color: "#34d399",
        },
      ];
    }

    return {
      id: seg.id || `seg-${idx + 1}`,
      heading,
      narration,
      keyTakeaway,
      visualActions,
    };
  });

  return {
    id: raw.id || `lesson-${Date.now()}`,
    title,
    topic: raw.topic || topic,
    summary,
    estimatedDuration,
    segments,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

// Singleton export
export const defaultAIProvider = new NvidiaNIMProvider();
