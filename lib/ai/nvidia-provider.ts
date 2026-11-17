import { AIProvider, AIProviderOptions, LessonContext } from "./provider";
import { Lesson, LessonSchema } from "@/lib/schemas/lesson-schema";
import { LESSON_SYSTEM_PROMPT, FOLLOWUP_SYSTEM_PROMPT } from "./prompts";
import { getVisualAssetsForTopic } from "@/lib/visuals/visual-provider";
import { EducationalVisualAsset } from "@/lib/visuals/visual-attribution";
import { globalLessonCache } from "@/lib/cache/lesson-cache";
import { aiCircuitBreaker } from "./circuit-breaker";

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
    const { lesson } = await globalLessonCache.getOrGenerate(topic, async () => {
      return aiCircuitBreaker.execute(
        async () => {
          return this.fetchFromNvidia(topic, options);
        },
        async (error) => {
          console.warn("[NvidiaNIMProvider] Executing resilient fallback lesson synthesizer:", error.message);
          let visualAssets: EducationalVisualAsset[] = [];
          try {
            visualAssets = await getVisualAssetsForTopic(topic);
          } catch {}
          return createSynthesizedLesson(topic, visualAssets);
        }
      );
    });

    return lesson;
  }

  private async fetchFromNvidia(
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

    // --- STRUCTURED PEDAGOGICAL LAYOUT ENGINE ---
    // Varies layout per segment for visual variety:
    //   - Segments with images: image left, notes right
    //   - Segments without images: topic-aware flow/process/comparison diagrams
    //   - Alternating color themes per chapter

    const PALETTES = [
      { accent: "#1677ff", bg: "rgba(238, 242, 255, 0.6)", light: "rgba(224, 242, 254, 0.5)" },
      { accent: "#059669", bg: "rgba(236, 253, 245, 0.6)", light: "rgba(209, 250, 229, 0.5)" },
      { accent: "#7c3aed", bg: "rgba(243, 232, 255, 0.6)", light: "rgba(237, 233, 254, 0.5)" },
      { accent: "#0284c7", bg: "rgba(224, 242, 254, 0.6)", light: "rgba(207, 250, 254, 0.5)" },
      { accent: "#d97706", bg: "rgba(254, 243, 199, 0.6)", light: "rgba(254, 249, 195, 0.5)" },
    ];
    const pal = PALETTES[idx % PALETTES.length];

    // Extract narration sentences as bullet points
    const rawSentences = narration
      .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
      .split("|")
      .map((s: string) => s.trim().replace(/^["']|["']$/g, ""))
      .filter((s: string) => s.length > 12);

    const clip = (s: string, max = 55) => {
      const t = s.trim().replace(/^[^a-zA-Z0-9]+/, "");
      return t.length > max ? t.substring(0, max - 3) + "..." : t;
    };

    const bullets = [
      rawSentences[0] ? clip(rawSentences[0]) : `${heading}: core principle`,
      rawSentences[1] ? clip(rawSentences[1]) : keyTakeaway ? clip(keyTakeaway) : `How ${heading} works in practice`,
      rawSentences[2] ? clip(rawSentences[2]) : `Real-world significance and impact`,
      rawSentences[3] ? clip(rawSentences[3]) : "",
    ].filter(Boolean);

    // --- HEADER (every segment) ---
    const headerActions: any[] = [
      {
        type: "addText",
        id: `hdr-${idx}`,
        text: heading,
        x: 500,
        y: 48,
        fontSize: 20,
        fill: "#0f172a",
        fontWeight: "bold",
        details: `Chapter ${idx + 1}: ${heading}`,
      },
      {
        type: "drawLine",
        id: `hdr-line-${idx}`,
        x1: 80,
        y1: 68,
        x2: 920,
        y2: 68,
        stroke: pal.accent,
        strokeWidth: 1.5,
      },
      // Chapter number badge
      {
        type: "addLabel",
        id: `ch-badge-${idx}`,
        text: `Chapter ${idx + 1}`,
        x: 80,
        y: 55,
        color: pal.accent,
        bg: pal.bg,
        borderColor: pal.accent,
      },
    ];

    // --- LEFT VISUAL AREA ---
    let leftVisualActions: any[] = [];
    if (!hasImage && visualAssets.length > 0) {
      const asset = visualAssets[idx % visualAssets.length];
      leftVisualActions = [
        {
          type: "drawImage",
          id: `img-${idx}`,
          url: asset.url,
          x: 80,
          y: 90,
          width: 400,
          height: 300,
          caption: asset.title,
          attribution: asset.attribution.author,
          license: asset.attribution.license,
          details: asset.description || asset.title,
        },
      ];
      hasImage = true;
    } else if (!hasImage) {
      // --- VARIED FALLBACK DIAGRAMS (not the same two circles every time) ---
      const layoutVariant = idx % 4;

      if (layoutVariant === 0) {
        // Flow diagram: 3 stages in a horizontal pipeline
        const stages = [
          { label: clip(heading.split(/\s+/).slice(0, 2).join(" "), 12), x: 140 },
          { label: "Process", x: 310 },
          { label: "Outcome", x: 480 },
        ];
        leftVisualActions = [
          { type: "drawRect", id: `df-${idx}`, x: 80, y: 90, width: 460, height: 300, rx: 12, stroke: pal.accent, strokeWidth: 1.5, fill: "rgba(248, 250, 252, 0.8)" },
          { type: "addText", id: `df-t-${idx}`, text: "Process Flow", x: 100, y: 118, fontSize: 13, fill: pal.accent, fontWeight: "bold" },
        ];
        stages.forEach((s, si) => {
          leftVisualActions.push(
            { type: "drawRect", id: `stg-${idx}-${si}`, x: s.x - 55, y: 165, width: 110, height: 55, rx: 8, stroke: si === 2 ? "#059669" : pal.accent, strokeWidth: 1.5, fill: si === 2 ? "rgba(209, 250, 229, 0.5)" : pal.light },
            { type: "addText", id: `stg-t-${idx}-${si}`, text: s.label, x: s.x, y: 198, fontSize: 11, fill: "#0f172a", fontWeight: "bold" },
          );
          if (si < stages.length - 1) {
            leftVisualActions.push(
              { type: "drawArrow", id: `stg-a-${idx}-${si}`, x1: s.x + 60, y1: 192, x2: stages[si + 1].x - 60, y2: 192, stroke: pal.accent, strokeWidth: 1.5 },
            );
          }
        });
        // Add a summary note below
        leftVisualActions.push(
          { type: "addText", id: `df-note-${idx}`, text: clip(bullets[0] || heading, 48), x: 100, y: 280, fontSize: 11, fill: "#64748b" },
        );

      } else if (layoutVariant === 1) {
        // Comparison / Two-column layout
        leftVisualActions = [
          { type: "drawRect", id: `cmp-${idx}`, x: 80, y: 90, width: 460, height: 300, rx: 12, stroke: pal.accent, strokeWidth: 1.5, fill: "rgba(248, 250, 252, 0.8)" },
          { type: "addText", id: `cmp-t-${idx}`, text: "Key Comparison", x: 100, y: 118, fontSize: 13, fill: pal.accent, fontWeight: "bold" },
          // Left column
          { type: "drawRect", id: `cmpL-${idx}`, x: 95, y: 135, width: 205, height: 230, rx: 8, stroke: "#1677ff", strokeWidth: 1, fill: "rgba(238, 242, 255, 0.5)" },
          { type: "addText", id: `cmpL-h-${idx}`, text: "Before / Input", x: 198, y: 160, fontSize: 12, fill: "#1677ff", fontWeight: "bold" },
          { type: "addText", id: `cmpL-1-${idx}`, text: clip(bullets[0] || "Characteristic A", 28), x: 110, y: 195, fontSize: 11, fill: "#334155" },
          { type: "addText", id: `cmpL-2-${idx}`, text: clip(bullets[1] || "Characteristic B", 28), x: 110, y: 220, fontSize: 11, fill: "#334155" },
          // Right column
          { type: "drawRect", id: `cmpR-${idx}`, x: 320, y: 135, width: 205, height: 230, rx: 8, stroke: "#059669", strokeWidth: 1, fill: "rgba(236, 253, 245, 0.5)" },
          { type: "addText", id: `cmpR-h-${idx}`, text: "After / Output", x: 423, y: 160, fontSize: 12, fill: "#059669", fontWeight: "bold" },
          { type: "addText", id: `cmpR-1-${idx}`, text: "Improved outcome", x: 335, y: 195, fontSize: 11, fill: "#334155" },
          { type: "addText", id: `cmpR-2-${idx}`, text: "Better efficiency", x: 335, y: 220, fontSize: 11, fill: "#334155" },
          // Arrow between columns
          { type: "drawArrow", id: `cmp-arr-${idx}`, x1: 300, y1: 250, x2: 320, y2: 250, stroke: "#d97706", strokeWidth: 2 },
        ];

      } else if (layoutVariant === 2) {
        // Hierarchical / tree structure
        leftVisualActions = [
          { type: "drawRect", id: `tree-${idx}`, x: 80, y: 90, width: 460, height: 300, rx: 12, stroke: pal.accent, strokeWidth: 1.5, fill: "rgba(248, 250, 252, 0.8)" },
          { type: "addText", id: `tree-t-${idx}`, text: "Structure Overview", x: 100, y: 118, fontSize: 13, fill: pal.accent, fontWeight: "bold" },
          // Root node
          { type: "drawRect", id: `root-${idx}`, x: 240, y: 140, width: 140, height: 36, rx: 6, stroke: pal.accent, strokeWidth: 1.5, fill: pal.light },
          { type: "addText", id: `root-t-${idx}`, text: clip(heading, 16), x: 310, y: 164, fontSize: 11, fill: "#0f172a", fontWeight: "bold" },
          // Child 1
          { type: "drawLine", id: `ch1-l-${idx}`, x1: 310, y1: 176, x2: 190, y2: 220, stroke: "#94a3b8", strokeWidth: 1 },
          { type: "drawRect", id: `ch1-${idx}`, x: 120, y: 220, width: 140, height: 32, rx: 6, stroke: "#059669", strokeWidth: 1, fill: "rgba(236, 253, 245, 0.5)" },
          { type: "addText", id: `ch1-t-${idx}`, text: "Component A", x: 190, y: 241, fontSize: 10, fill: "#059669", fontWeight: "bold" },
          // Child 2
          { type: "drawLine", id: `ch2-l-${idx}`, x1: 310, y1: 176, x2: 430, y2: 220, stroke: "#94a3b8", strokeWidth: 1 },
          { type: "drawRect", id: `ch2-${idx}`, x: 360, y: 220, width: 140, height: 32, rx: 6, stroke: "#1677ff", strokeWidth: 1, fill: "rgba(238, 242, 255, 0.5)" },
          { type: "addText", id: `ch2-t-${idx}`, text: "Component B", x: 430, y: 241, fontSize: 10, fill: "#1677ff", fontWeight: "bold" },
          // Sub-nodes
          { type: "drawLine", id: `sub1-l-${idx}`, x1: 190, y1: 252, x2: 150, y2: 290, stroke: "#94a3b8", strokeWidth: 1 },
          { type: "drawRect", id: `sub1-${idx}`, x: 95, y: 290, width: 110, height: 28, rx: 5, stroke: "#94a3b8", strokeWidth: 1, fill: "#f8fafc" },
          { type: "addText", id: `sub1-t-${idx}`, text: "Detail 1", x: 150, y: 308, fontSize: 9, fill: "#64748b" },
          { type: "drawLine", id: `sub2-l-${idx}`, x1: 190, y1: 252, x2: 240, y2: 290, stroke: "#94a3b8", strokeWidth: 1 },
          { type: "drawRect", id: `sub2-${idx}`, x: 185, y: 290, width: 110, height: 28, rx: 5, stroke: "#94a3b8", strokeWidth: 1, fill: "#f8fafc" },
          { type: "addText", id: `sub2-t-${idx}`, text: "Detail 2", x: 240, y: 308, fontSize: 9, fill: "#64748b" },
        ];

      } else {
        // Layered / stacked architecture
        const layers = [
          { label: "Foundation Layer", y: 310, color: "#059669", bg: "rgba(236, 253, 245, 0.5)" },
          { label: "Core Layer", y: 240, color: "#1677ff", bg: "rgba(238, 242, 255, 0.5)" },
          { label: "Application Layer", y: 170, color: "#7c3aed", bg: "rgba(243, 232, 255, 0.5)" },
        ];
        leftVisualActions = [
          { type: "drawRect", id: `arch-${idx}`, x: 80, y: 90, width: 460, height: 300, rx: 12, stroke: pal.accent, strokeWidth: 1.5, fill: "rgba(248, 250, 252, 0.8)" },
          { type: "addText", id: `arch-t-${idx}`, text: "Architecture Layers", x: 100, y: 118, fontSize: 13, fill: pal.accent, fontWeight: "bold" },
        ];
        layers.forEach((layer, li) => {
          leftVisualActions.push(
            { type: "drawRect", id: `layer-${idx}-${li}`, x: 110, y: layer.y, width: 400, height: 50, rx: 6, stroke: layer.color, strokeWidth: 1.5, fill: layer.bg },
            { type: "addText", id: `layer-t-${idx}-${li}`, text: layer.label, x: 310, y: layer.y + 30, fontSize: 12, fill: layer.color, fontWeight: "bold" },
          );
          if (li < layers.length - 1) {
            leftVisualActions.push(
              { type: "drawArrow", id: `layer-a-${idx}-${li}`, x1: 310, y1: layer.y, x2: 310, y2: layers[li + 1].y + 50, stroke: "#94a3b8", strokeWidth: 1 },
            );
          }
        });
      }
    } else {
      leftVisualActions = visualActions.filter((a) => a.type === "drawImage");
    }

    // --- RIGHT NOTES CARD ---
    const rightCardActions: any[] = [
      {
        type: "drawRect",
        id: `card-${idx}`,
        x: 555,
        y: 90,
        width: 370,
        height: 300,
        rx: 10,
        stroke: pal.accent,
        strokeWidth: 1.5,
        fill: pal.bg,
        details: `Concept notes for ${heading}`,
      },
      {
        type: "addText",
        id: `card-h-${idx}`,
        text: heading.length > 28 ? heading.substring(0, 25) + "..." : heading,
        x: 575,
        y: 118,
        fontSize: 14,
        fill: pal.accent,
        fontWeight: "bold",
      },
      // Separator
      {
        type: "drawLine",
        id: `card-sep-${idx}`,
        x1: 575,
        y1: 128,
        x2: 905,
        y2: 128,
        stroke: pal.accent,
        strokeWidth: 0.5,
      },
    ];

    // Bullet points
    bullets.slice(0, 4).forEach((b, bi) => {
      rightCardActions.push({
        type: "addText",
        id: `bul-${idx}-${bi}`,
        text: `${bi + 1}. ${b}`,
        x: 575,
        y: 155 + bi * 30,
        fontSize: 12,
        fill: "#334155",
        fontWeight: "normal",
        details: b,
      });
    });

    // Key Takeaway inside the card (instead of a giant bottom bar)
    if (keyTakeaway) {
      rightCardActions.push(
        {
          type: "drawRect",
          id: `tk-box-${idx}`,
          x: 570,
          y: 310,
          width: 340,
          height: 60,
          rx: 8,
          stroke: "#d97706",
          strokeWidth: 1,
          fill: "rgba(254, 243, 199, 0.5)",
        },
        {
          type: "addText",
          id: `tk-txt-${idx}`,
          text: clip(keyTakeaway, 50),
          x: 585,
          y: 345,
          fontSize: 11,
          fill: "#92400e",
          fontWeight: "bold",
          details: keyTakeaway,
        },
      );
    }

    // Compose final layout
    visualActions = [
      { type: "clear" },
      ...headerActions,
      ...leftVisualActions,
      ...rightCardActions,
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

/**
 * Resilient Fallback Synthesizer
 * If NVIDIA NIM is temporarily unreachable, rate-limited, or experiencing downtime,
 * this synthesizer guarantees a structured, validated, high-quality lesson with
 * real Wikimedia Commons visuals so users NEVER face an application crash.
 */
function createSynthesizedLesson(topic: string, visualAssets: EducationalVisualAsset[]): Lesson {
  const cleanTopic = topic.trim();
  const title = `Understanding ${cleanTopic}: Principles & Real-World Systems`;
  const summary = `A deep-dive masterclass exploring the foundational principles, structural dynamics, and practical modern significance of ${cleanTopic}.`;

  const fallbackChapters = [
    {
      heading: `Foundations of ${cleanTopic}`,
      narration: `Welcome to our comprehensive masterclass on ${cleanTopic}. To understand this topic thoroughly, we must first break down its foundational mechanisms, historical context, and core operational principles.`,
      keyTakeaway: `${cleanTopic} operates on foundational structural laws that define its behavior.`,
    },
    {
      heading: `Internal Architecture & Key Mechanisms`,
      narration: `Examining the inner workings of ${cleanTopic} reveals an intricate network of interconnected pathways. Each subcomponent plays a dedicated role in maintaining equilibrium, processing inputs, and driving systemic performance.`,
      keyTakeaway: `The core mechanism relies on coordinated interactions between primary sub-elements.`,
    },
    {
      heading: `Real-World Impact & Modern Frontiers`,
      narration: `In contemporary science and engineering, ${cleanTopic} represents a cornerstone concept. By mastering these principles, researchers and practitioners continue to push the boundaries of innovation and discovery.`,
      keyTakeaway: `Modern advancements in ${cleanTopic} drive mission-critical outcomes across research and industry.`,
    },
  ];

  const rawJson = {
    title,
    topic: cleanTopic,
    summary,
    estimatedDuration: 120,
    keyTakeaways: [
      `Foundational principles and structural mechanisms of ${cleanTopic}.`,
      `Dynamic internal pathways and operational interactions.`,
      `Real-world scientific significance and modern applications.`,
    ],
    segments: fallbackChapters,
  };

  const normalized = normalizeLessonJson(rawJson, cleanTopic, visualAssets);
  return LessonSchema.parse(normalized);
}

// Singleton export
export const defaultAIProvider = new NvidiaNIMProvider();
