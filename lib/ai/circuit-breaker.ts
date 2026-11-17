/**
 * Circuit Breaker for AI API resilience.
 *
 * Prevents cascading failures and protects external LLM quota during upstream
 * outages. Fatal caller-side problems (missing/invalid API key, exhausted rate
 * limit) are deliberately NOT handled here: they are rethrown untouched so the
 * route can answer 401/429, and they never count towards tripping the circuit.
 */

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerConfig {
  failureThreshold?: number; // Failures before opening circuit (default 3)
  recoveryTimeMs?: number; // Wait time before trying half-open (default 30s)
}

export interface ExecuteOptions {
  /**
   * Decides whether a thrown error should be absorbed into the fallback.
   * Returning false rethrows the error and leaves the circuit untouched.
   * Defaults to absorbing every error.
   */
  shouldFallback?: (error: Error) => boolean;
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
      console.warn(
        `[CircuitBreaker] Circuit TRIPPED to OPEN. Consecutive failures: ${this.failureCount}`
      );
    }
  }

  /** Test seam: resets the breaker to a pristine CLOSED state. */
  public reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }

  public async execute<T>(
    action: () => Promise<T>,
    fallback: (error: Error) => Promise<T>,
    options: ExecuteOptions = {}
  ): Promise<T> {
    const shouldFallback = options.shouldFallback ?? (() => true);
    const currentState = this.getState();

    if (currentState === "OPEN") {
      console.warn(
        "[CircuitBreaker] Circuit is OPEN. Triggering graceful fallback without hitting external API."
      );
      return fallback(
        new Error("Circuit breaker is OPEN due to repeated external API failures.")
      );
    }

    try {
      const result = await action();
      this.recordSuccess();
      return result;
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));

      if (!shouldFallback(error)) {
        // Caller-side problem (bad key, quota). Surface it; don't blame upstream.
        throw error;
      }

      this.recordFailure();
      console.warn(
        `[CircuitBreaker] External call failed (${error.message}). Executing fallback.`
      );
      return fallback(error);
    }
  }
}

export const aiCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeMs: 25000,
});
