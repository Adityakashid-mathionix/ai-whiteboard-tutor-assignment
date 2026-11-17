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

    // If segment has no image and we have visualAssets, inject a real Wikimedia image!
    if (!hasImage && visualAssets.length > 0) {
      const asset = visualAssets[idx % visualAssets.length];
      const imageAction = {
        type: "drawImage",
        id: `real-img-${idx + 1}`,
        url: asset.url,
        x: 80,
        y: 130,
        width: 380,
        height: 270,
        caption: asset.title,
        attribution: asset.attribution.author,
        license: asset.attribution.license,
        details: asset.description || asset.title,
        tooltip: asset.title,
      };

      // Put real image at the front of visual actions
      visualActions.unshift(imageAction);
      hasImage = true;
    }

    // Guarantee that visualActions contains a rich, complete diagram (min 6 actions)
    if (visualActions.length < 5) {
      const isFirst = idx === 0;
      const cardColor = isFirst ? "#1677ff" : idx % 2 === 0 ? "#059669" : "#d97706";
      const cardBg = isFirst
        ? "rgba(238, 242, 255, 0.75)"
        : idx % 2 === 0
        ? "rgba(236, 253, 245, 0.75)"
        : "rgba(254, 243, 199, 0.75)";

      // Top Header Title Banner
      visualActions.unshift({
        type: "addText",
        id: `banner-${idx}`,
        text: `${heading}`,
        x: 500,
        y: 65,
        fontSize: 20,
        fill: "#0f172a",
        fontWeight: "bold",
        details: `Chapter ${idx + 1}: ${heading}`,
      });

      // Top Divider Line
      visualActions.push({
        type: "drawLine",
        id: `div-${idx}`,
        x1: 120,
        y1: 85,
        x2: 880,
        y2: 85,
        stroke: cardColor,
        strokeWidth: 2,
      });

      // Right-side Architecture / Specifications Card
      visualActions.push({
        type: "drawRect",
        id: `card-${idx}`,
        x: 490,
        y: 130,
        width: 430,
        height: 270,
        rx: 14,
        stroke: cardColor,
        strokeWidth: 2,
        fill: cardBg,
        details: `Architectural breakdown and core mechanisms for ${heading}.`,
        tooltip: "Mechanism Breakdown",
      });

      // Card Header
      visualActions.push({
        type: "addText",
        id: `card-title-${idx}`,
        text: `Core Dynamics: ${heading}`,
        x: 520,
        y: 165,
        fontSize: 15,
        fill: cardColor,
        fontWeight: "bold",
      });

      // Bullet points
      visualActions.push({
        type: "addText",
        id: `bullet1-${idx}`,
        text: `• Mechanism: Integrated systems & workflow structure`,
        x: 520,
        y: 205,
        fontSize: 13,
        fill: "#334155",
        details: "Primary functional workflow of this component.",
      });

      visualActions.push({
        type: "addText",
        id: `bullet2-${idx}`,
        text: `• Interaction: Real-time response and boundary flow`,
        x: 520,
        y: 235,
        fontSize: 13,
        fill: "#334155",
        details: "Internal communication pathway between elements.",
      });

      visualActions.push({
        type: "addText",
        id: `bullet3-${idx}`,
        text: `• Innovation: Solved key engineering bottlenecks`,
        x: 520,
        y: 265,
        fontSize: 13,
        fill: "#334155",
        details: "Historical breakthrough that enabled modern performance.",
      });

      // Connecting Arrow
      visualActions.push({
        type: "drawArrow",
        id: `flow-arr-${idx}`,
        x1: 460,
        y1: 265,
        x2: 490,
        y2: 265,
        stroke: cardColor,
        strokeWidth: 2.5,
        label: "Drives",
        details: "Direct functional connection between visual model and specs.",
      });

      // Bottom Milestone / Key Takeaway Callout Box
      visualActions.push({
        type: "drawRect",
        id: `takeaway-box-${idx}`,
        x: 80,
        y: 430,
        width: 840,
        height: 75,
        rx: 12,
        stroke: "#d97706",
        strokeWidth: 1.5,
        fill: "rgba(254, 243, 199, 0.7)",
        details: keyTakeaway || `Key principle of ${heading}`,
        tooltip: "Master Takeaway",
      });

      visualActions.push({
        type: "addText",
        id: `takeaway-txt-${idx}`,
        text: `💡 Key Takeaway: ${keyTakeaway || narration.substring(0, 90)}...`,
        x: 105,
        y: 472,
        fontSize: 13,
        fill: "#92400e",
        fontWeight: "bold",
        details: keyTakeaway || narration,
      });
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
    keyTakeaways,
    segments,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

// Singleton export
export const defaultAIProvider = new NvidiaNIMProvider();
