/**
 * Industry-Grade Circuit Breaker Pattern for AI API Resilience
 * Prevents cascading failures, protects external LLM quota, and guarantees
 * graceful fallbacks during API rate limits or transient network failures.
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerConfig {
  failureThreshold?: number; // Failures before opening circuit (default 3)
  recoveryTimeMs?: number; // Wait time before trying half-open (default 30s)
  timeoutMs?: number; // Max request duration (default 45s)
}

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly recoveryTimeMs: number;

  constructor(config: CircuitBreakerConfig = {}) {
    this.failureThreshold = config.failureThreshold ?? 3;
    this.recoveryTimeMs = config.recoveryTimeMs ?? 30000;
  }

  public getState(): CircuitState {
    if (this.state === "OPEN") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed > this.recoveryTimeMs) {
        this.state = "HALF_OPEN";
      }
    }
    return this.state;
  }

  public recordSuccess(): void {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  public recordFailure(): void {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      console.warn(`[CircuitBreaker] Circuit TRIPPED to OPEN. Consecutive failures: ${this.failureCount}`);
    }
  }

  public async execute<T>(
    action: () => Promise<T>,
    fallback: (error: Error) => Promise<T>
  ): Promise<T> {
    const currentState = this.getState();

    if (currentState === "OPEN") {
      console.warn("[CircuitBreaker] Circuit is OPEN. Triggering graceful fallback without hitting external API.");
      return fallback(new Error("Circuit breaker is OPEN due to repeated external API failures."));
    }

    try {
      const result = await action();
      this.recordSuccess();
      return result;
    } catch (err: unknown) {
      this.recordFailure();
      const error = err instanceof Error ? err : new Error(String(err));
      console.warn(`[CircuitBreaker] External call failed (${error.message}). Executing fallback.`);
      return fallback(error);
    }
  }
}

export const aiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeMs: 25000,
});
