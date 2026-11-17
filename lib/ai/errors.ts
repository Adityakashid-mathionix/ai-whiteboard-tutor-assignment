/**
 * Typed AI provider errors.
 *
 * `fatal` errors are configuration or quota problems that the caller must see
 * (missing key, bad key, rate limit). They are NEVER masked by the resilient
 * fallback lesson, because silently serving a generic template lesson makes the
 * app look like it worked while teaching the student nothing useful.
 *
 * Non-fatal errors (upstream 5xx, network blips, unparseable model output) are
 * genuine transient failures where a clearly-labelled fallback lesson is better
 * than a crash.
 */
export type AIErrorKind =
  | "auth"
  | "rate_limit"
  | "timeout"
  | "upstream"
  | "network"
  | "invalid_response";

const FATAL_KINDS: ReadonlySet<AIErrorKind> = new Set<AIErrorKind>([
  "auth",
  "rate_limit",
]);

const STATUS_BY_KIND: Record<AIErrorKind, number> = {
  auth: 401,
  rate_limit: 429,
  timeout: 504,
  upstream: 502,
  network: 502,
  invalid_response: 502,
};

export class AIProviderError extends Error {
  public readonly kind: AIErrorKind;
  public readonly status: number;

  constructor(kind: AIErrorKind, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "AIProviderError";
    this.kind = kind;
    this.status = STATUS_BY_KIND[kind];
    if (options?.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }

  /** True when the error must be surfaced to the user instead of falling back. */
  public get fatal(): boolean {
    return FATAL_KINDS.has(this.kind);
  }
}

export function isFatalAIError(error: unknown): boolean {
  return error instanceof AIProviderError && error.fatal;
}

/** Maps any thrown value to the HTTP status an API route should answer with. */
export function httpStatusForError(error: unknown): number {
  if (error instanceof AIProviderError) return error.status;
  return 500;
}
