import { Lesson } from "@/types/lesson";

export type LessonSource = "ai" | "fallback" | "cache" | "exemplar";

export interface GeneratedLesson {
  lesson: Lesson;
  /** Where the lesson actually came from. Only "ai" results are cacheable. */
  source: LessonSource;
}

export interface LessonCacheKeyParts {
  topic: string;
  model?: string;
  level?: string;
}

interface CacheEntry {
  lesson: Lesson;
  createdAt: number;
  expiresAt: number;
  hits: number;
}

/**
 * In-memory TTL + LRU cache with request deduplication.
 *
 * Reduces NVIDIA NIM API cost by serving identical requests instantly. The key
 * covers the model and learning level as well as the topic, so two users
 * asking for the same topic at different depths (or with a different model
 * selected) never receive each other's lesson.
 *
 * Only genuinely AI-generated lessons are stored. Fallback lessons are never
 * cached, otherwise a single transient upstream failure would pin a generic
 * template lesson to that topic for the whole TTL.
 */
class LessonCache {
  private cache = new Map<string, CacheEntry>();
  private inFlightRequests = new Map<string, Promise<GeneratedLesson>>();
  private readonly defaultTTL = 1000 * 60 * 60 * 24; // 24 hours
  private readonly maxEntries = 500;

  /**
   * Normalizes a topic string into a deterministic canonical form.
   * E.g. "What is Rabies?" -> "rabies"
   */
  public normalizeTopicKey(topic: string): string {
    return topic
      .toLowerCase()
      .trim()
      .replace(/^(what is|how does|explain|tell me about|guide to|overview of|the)\s+/i, "")
      .replace(/[?!.,;:()'"]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Full cache key: topic + model + level. */
  public buildKey(parts: LessonCacheKeyParts): string {
    return [
      this.normalizeTopicKey(parts.topic),
      (parts.model || "default").toLowerCase(),
      (parts.level || "beginner").toLowerCase(),
    ].join("::");
  }

  public get(parts: LessonCacheKeyParts): Lesson | null {
    const key = this.buildKey(parts);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.hits += 1;
    // Re-insert so Map iteration order reflects true recency of use.
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.lesson;
  }

  public set(parts: LessonCacheKeyParts, lesson: Lesson, ttlMs: number = this.defaultTTL): void {
    const key = this.buildKey(parts);

    // Evict least-recently-used entry once the size limit is reached.
    if (!this.cache.has(key) && this.cache.size >= this.maxEntries) {
      const lruKey = this.cache.keys().next().value;
      if (lruKey) this.cache.delete(lruKey);
    }

    this.cache.set(key, {
      lesson,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      hits: 0,
    });
  }

  /**
   * Cache-aside read-through with request deduplication: if an identical
   * request is already in flight, the existing promise is awaited instead of
   * firing a second expensive concurrent LLM call.
   */
  public async getOrGenerate(
    parts: LessonCacheKeyParts,
    generator: () => Promise<GeneratedLesson>
  ): Promise<GeneratedLesson> {
    const key = this.buildKey(parts);

    const existing = this.get(parts);
    if (existing) {
      return { lesson: existing, source: "cache" };
    }

    const pending = this.inFlightRequests.get(key);
    if (pending) {
      const result = await pending;
      return { lesson: result.lesson, source: result.source };
    }

    const requestPromise = (async () => {
      try {
        const result = await generator();
        // Never cache fallback output — it would outlive the outage.
        if (result.source === "ai") {
          this.set(parts, result.lesson);
        }
        return result;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, requestPromise);
    return requestPromise;
  }

  public getStats() {
    return {
      size: this.cache.size,
      inFlight: this.inFlightRequests.size,
    };
  }

  public clear() {
    this.cache.clear();
    this.inFlightRequests.clear();
  }
}

export const globalLessonCache = new LessonCache();
export type { LessonCache };
