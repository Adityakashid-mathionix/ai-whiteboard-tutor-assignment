import { AIProvider, AIProviderOptions, LessonContext } from "./provider";
import { Lesson, LessonSchema } from "@/lib/schemas/lesson-schema";
import { LESSON_SYSTEM_PROMPT, FOLLOWUP_SYSTEM_PROMPT } from "./prompts";
import { getVisualAssetsForTopic } from "@/lib/visuals/visual-provider";
import { EducationalVisualAsset } from "@/lib/visuals/visual-attribution";

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
      // 1. Fetch real educational visual assets from Wikimedia Commons for this topic
      let visualAssets: EducationalVisualAsset[] = [];
      try {
        visualAssets = await getVisualAssetsForTopic(topic);
      } catch (assetErr) {
        console.warn("Visual assets retrieval notice:", assetErr);
      }

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
              content: `Please create a complete educational masterclass on the topic: "${topic.trim()}". Return the response strictly as valid JSON adhering to the whiteboard schema.`,
            },
          ],
          temperature: 0.2,
          max_tokens: 3800,
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

      // 2. Normalize and enrich with real images, layout structure & high-contrast coordinates
      const normalized = normalizeLessonJson(parsedJson, topic, visualAssets);

      // 3. Validate with Zod
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

function normalizeLessonJson(raw: any, topic: string, visualAssets: EducationalVisualAsset[] = []) {
  if (!raw || typeof raw !== "object") return raw;

  const title = raw.title || raw.lessonTitle || topic;
  const summary =
    raw.summary ||
    raw.overview ||
    raw.description ||
    `Educational masterclass explaining ${topic}.`;
  const estimatedDuration = Number(raw.estimatedDuration) || 120;
  const keyTakeaways = Array.isArray(raw.keyTakeaways) ? raw.keyTakeaways : [];

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
      "drawImage",
      "erase",
      "clear",
    ];

    // Check if LLM already output a valid image
    let hasImage = rawActions.some(
      (a: any) =>
        (a.type === "drawImage" || a.type === "image") &&
        typeof a.url === "string" &&
        a.url.startsWith("http")
    );

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
        else if (type === "image") type = "drawImage";

        if (!validTypes.includes(type)) {
          if (act.url) type = "drawImage";
          else if (act.text) type = "addText";
          else if (act.cx !== undefined) type = "drawCircle";
          else if (act.x1 !== undefined && act.x2 !== undefined) type = "drawLine";
          else type = "drawRect";
        }

        // Guarantee high contrast fills & visible coordinates on white smartboard
        if (type === "addText") {
          const rawFill = act.fill || "";
          const isTooLight =
            !rawFill ||
            rawFill === "#f8fafc" ||
            rawFill === "#ffffff" ||
            rawFill === "#fff" ||
            rawFill.includes("255, 255, 255");
          return {
            type: "addText",
            id: act.id || `act-txt-${idx}-${aIdx}`,
            text: String(act.text || heading),
            x: Number(act.x) || 500,
            y: Number(act.y) || 80,
            fontSize: Number(act.fontSize) || 16,
            fill: isTooLight ? "#0f172a" : rawFill,
            fontWeight: act.fontWeight || "normal",
            details: act.details || `Key concept text: ${act.text}`,
            tooltip: act.tooltip || act.text,
          };
        } else if (type === "drawCircle") {
          return {
            type: "drawCircle",
            id: act.id || `act-circ-${idx}-${aIdx}`,
            cx: Number(act.cx) || 400,
            cy: Number(act.cy) || 300,
            r: Number(act.r) || 45,
            stroke: act.stroke || "#1677ff",
            strokeWidth: Number(act.strokeWidth) || 2.5,
            fill: act.fill || "rgba(224, 242, 254, 0.6)",
            details: act.details || "Core visual component",
            tooltip: act.tooltip || "Component Node",
          };
        } else if (type === "drawRect") {
          return {
            type: "drawRect",
            id: act.id || `act-rect-${idx}-${aIdx}`,
            x: Number(act.x) || 300,
            y: Number(act.y) || 200,
            width: Number(act.width) || 220,
            height: Number(act.height) || 140,
            rx: Number(act.rx) || 12,
            stroke: act.stroke || "#1677ff",
            strokeWidth: Number(act.strokeWidth) || 2,
            fill: act.fill || "rgba(238, 242, 255, 0.7)",
            details: act.details || "Structured concept card",
            tooltip: act.tooltip || "Concept Specification",
          };
        } else if (type === "drawLine") {
          return {
            type: "drawLine",
            id: act.id || `act-line-${idx}-${aIdx}`,
            x1: Number(act.x1) || 150,
            y1: Number(act.y1) || 80,
            x2: Number(act.x2) || 850,
            y2: Number(act.y2) || 80,
            stroke: act.stroke || "#1677ff",
            strokeWidth: Number(act.strokeWidth) || 2,
          };
        } else if (type === "drawArrow") {
          return {
            type: "drawArrow",
            id: act.id || `act-arrow-${idx}-${aIdx}`,
            x1: Number(act.x1) || 300,
            y1: Number(act.y1) || 300,
            x2: Number(act.x2) || 480,
            y2: Number(act.y2) || 300,
            stroke: act.stroke || "#0284c7",
            strokeWidth: Number(act.strokeWidth) || 2.5,
            label: act.label || "Flow",
            details: act.details || "Directional connection",
          };
        } else if (type === "drawImage") {
          return {
            type: "drawImage",
            id: act.id || `act-img-${idx}-${aIdx}`,
            url: act.url,
            x: Number(act.x) || 80,
            y: Number(act.y) || 130,
            width: Number(act.width) || 380,
            height: Number(act.height) || 270,
            caption: act.caption || heading,
            attribution: act.attribution || "Wikimedia Commons",
            license: act.license || "CC BY-SA",
            details: act.details || `Educational illustration for ${heading}`,
            tooltip: act.tooltip || act.caption || heading,
          };
        }

        return {
          ...act,
          id: act.id || `act-${idx}-${aIdx}`,
          type,
        };
      });
    }

    // --- STRUCTURED PEDAGOGICAL LAYOUT COMPOSITION ---
    // Every segment gets a clean, balanced layout:
    // 1. Top Header Banner & Divider
    // 2. Left: Real Educational Image (or Vector Diagram Frame)
    // 3. Right: Structured Concept Card with points matching the spoken narration
    // 4. Bottom: Key Takeaway Principle Card

    const cardColor = idx % 3 === 0 ? "#1677ff" : idx % 3 === 1 ? "#059669" : "#d97706";
    const cardBg =
      idx % 3 === 0
        ? "rgba(238, 242, 255, 0.75)"
        : idx % 3 === 1
        ? "rgba(236, 253, 245, 0.75)"
        : "rgba(254, 243, 199, 0.75)";

    // Break narration into actionable conceptual bullet points
    const rawSentences = narration
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .map((s: string) => s.trim().replace(/^["']|["']$/g, ""))
      .filter((s: string) => s.length > 12);

    const bullet1 = rawSentences[0]
      ? rawSentences[0].length > 60
        ? rawSentences[0].substring(0, 57) + "..."
        : rawSentences[0]
      : "Core mechanisms and foundational concepts";

    const bullet2 = rawSentences[1]
      ? rawSentences[1].length > 60
        ? rawSentences[1].substring(0, 57) + "..."
        : rawSentences[1]
      : "Dynamic interactions and behavioral flow";

    const bullet3 = rawSentences[2]
      ? rawSentences[2].length > 60
        ? rawSentences[2].substring(0, 57) + "..."
        : rawSentences[2]
      : "Critical takeaways and systemic importance";

    // 1. Top Header Title Banner & Divider
    const bannerActions: any[] = [
      {
        type: "addText",
        id: `banner-${idx}`,
        text: heading,
        x: 500,
        y: 50,
        fontSize: 21,
        fill: "#0f172a",
        fontWeight: "bold",
        details: `Chapter ${idx + 1}: ${heading}`,
      },
      {
        type: "drawLine",
        id: `div-${idx}`,
        x1: 90,
        y1: 72,
        x2: 910,
        y2: 72,
        stroke: cardColor,
        strokeWidth: 2,
      },
    ];

    // 2. Left Visual Area (Real Educational Image or Diagram Chassis)
    let leftVisualActions: any[] = [];
    if (!hasImage && visualAssets.length > 0) {
      const asset = visualAssets[idx % visualAssets.length];
      leftVisualActions = [
        {
          type: "drawImage",
          id: `real-img-${idx + 1}`,
          url: asset.url,
          x: 80,
          y: 105,
          width: 385,
          height: 290,
          caption: asset.title,
          attribution: asset.attribution.author,
          license: asset.attribution.license,
          details: asset.description || asset.title,
          tooltip: asset.title,
        },
      ];
      hasImage = true;
    } else if (!hasImage) {
      // If no image returned, create a structured Vector Diagram Frame
      leftVisualActions = [
        {
          type: "drawRect",
          id: `diag-frame-${idx}`,
          x: 80,
          y: 105,
          width: 385,
          height: 290,
          rx: 14,
          stroke: cardColor,
          strokeWidth: 2,
          fill: "rgba(248, 250, 252, 0.85)",
          details: "Visual schematic model container.",
          tooltip: "Model Schematic",
        },
        {
          type: "addText",
          id: `diag-title-${idx}`,
          text: `Visual Schematic: ${heading}`,
          x: 105,
          y: 135,
          fontSize: 14,
          fill: cardColor,
          fontWeight: "bold",
        },
        // Central illustrative nodes
        {
          type: "drawCircle",
          id: `node-a-${idx}`,
          cx: 180,
          cy: 240,
          r: 40,
          stroke: cardColor,
          strokeWidth: 2.5,
          fill: "rgba(255, 255, 255, 0.9)",
          details: "Input / Primary Component",
        },
        {
          type: "addText",
          id: `node-a-txt-${idx}`,
          text: "Primary",
          x: 180,
          y: 245,
          fontSize: 12,
          fill: "#0f172a",
          fontWeight: "bold",
        },
        {
          type: "drawArrow",
          id: `node-arr-${idx}`,
          x1: 225,
          y1: 240,
          x2: 315,
          y2: 240,
          stroke: cardColor,
          strokeWidth: 2.5,
          label: "Mechanism",
        },
        {
          type: "drawCircle",
          id: `node-b-${idx}`,
          cx: 360,
          cy: 240,
          r: 40,
          stroke: "#059669",
          strokeWidth: 2.5,
          fill: "rgba(255, 255, 255, 0.9)",
          details: "Output / Target Response",
        },
        {
          type: "addText",
          id: `node-b-txt-${idx}`,
          text: "Response",
          x: 360,
          y: 245,
          fontSize: 12,
          fill: "#0f172a",
          fontWeight: "bold",
        },
      ];
    } else {
      // LLM already had an image, retain it
      leftVisualActions = visualActions.filter((a) => a.type === "drawImage");
    }

    // 3. Right Structured Concept Card
    const rightCardActions: any[] = [
      {
        type: "drawRect",
        id: `card-${idx}`,
        x: 485,
        y: 105,
        width: 435,
        height: 290,
        rx: 14,
        stroke: cardColor,
        strokeWidth: 2,
        fill: cardBg,
        details: `Structured conceptual breakdown of ${heading}.`,
        tooltip: "Concept Breakdown",
      },
      {
        type: "addText",
        id: `card-title-${idx}`,
        text: `Key Dynamics: ${heading}`,
        x: 510,
        y: 140,
        fontSize: 15,
        fill: cardColor,
        fontWeight: "bold",
      },
      {
        type: "addText",
        id: `bullet1-${idx}`,
        text: `• ${bullet1}`,
        x: 510,
        y: 180,
        fontSize: 13,
        fill: "#334155",
        fontWeight: "normal",
        details: bullet1,
      },
      {
        type: "addText",
        id: `bullet2-${idx}`,
        text: `• ${bullet2}`,
        x: 510,
        y: 215,
        fontSize: 13,
        fill: "#334155",
        fontWeight: "normal",
        details: bullet2,
      },
      {
        type: "addText",
        id: `bullet3-${idx}`,
        text: `• ${bullet3}`,
        x: 510,
        y: 250,
        fontSize: 13,
        fill: "#334155",
        fontWeight: "normal",
        details: bullet3,
      },
      {
        type: "drawArrow",
        id: `flow-arr-${idx}`,
        x1: 465,
        y1: 250,
        x2: 485,
        y2: 250,
        stroke: cardColor,
        strokeWidth: 2.5,
        label: "Sync",
      },
    ];

    // 4. Bottom Milestone / Key Takeaway Callout Box
    const takeawayActions: any[] = [
      {
        type: "drawRect",
        id: `takeaway-box-${idx}`,
        x: 80,
        y: 420,
        width: 840,
        height: 75,
        rx: 12,
        stroke: "#d97706",
        strokeWidth: 1.5,
        fill: "rgba(254, 243, 199, 0.75)",
        details: keyTakeaway || `Core principle of ${heading}`,
        tooltip: "Master Takeaway",
      },
      {
        type: "addText",
        id: `takeaway-txt-${idx}`,
        text: `💡 Key Insight: ${keyTakeaway || narration.substring(0, 85)}...`,
        x: 105,
        y: 462,
        fontSize: 13,
        fill: "#92400e",
        fontWeight: "bold",
        details: keyTakeaway || narration,
      },
    ];

    // Compose final actions: Clear -> Banner -> Left Visuals -> Right Concepts -> Bottom Takeaway
    visualActions = [
      { type: "clear" },
      ...bannerActions,
      ...leftVisualActions,
      ...rightCardActions,
      ...takeawayActions,
    ];

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
    keyTakeaways,
    segments,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

// Singleton export
export const defaultAIProvider = new NvidiaNIMProvider();
