/**
 * Allowlist for anything the whiteboard is asked to load.
 *
 * `drawImage` actions carry a URL that originates from model output, which is
 * untrusted input. Rendering it straight into an <image href> would let a
 * prompt-injected or hallucinated URL pull an arbitrary remote resource into
 * the page: a tracking pixel, an attacker-controlled SVG (which can carry its
 * own script when loaded as a document), or a `javascript:` / `data:` payload.
 *
 * Only https URLs on hosts we deliberately serve educational media from are
 * allowed through; everything else is dropped and the chapter falls back to a
 * drawn diagram.
 */

const ALLOWED_IMAGE_HOSTS: readonly string[] = [
  "upload.wikimedia.org",
  "commons.wikimedia.org",
];

/** True when `url` is an https URL on an allowlisted media host. */
export function isAllowedImageUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 2048) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  // Blocks javascript:, data:, blob:, file: and plain http.
  if (parsed.protocol !== "https:") return false;

  // Credentials in a URL are never legitimate here.
  if (parsed.username || parsed.password) return false;

  const host = parsed.hostname.toLowerCase();
  return ALLOWED_IMAGE_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

/** Returns the URL when it is allowed, otherwise null. */
export function safeImageUrl(url: unknown): string | null {
  return isAllowedImageUrl(url) ? url : null;
}

/**
 * SVG path data is passed to the renderer verbatim, so restrict it to the
 * command and number grammar a path can legitimately contain. Anything else
 * (quotes, angle brackets, parentheses, url(...) references) is rejected.
 */
const PATH_GRAMMAR = /^[MmLlHhVvCcSsQqTtAaZz0-9\s,.+-]+$/;

export function isSafePathData(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.length >= 2 &&
    path.length <= 4096 &&
    PATH_GRAMMAR.test(path)
  );
}

/** Returns sanitized path data, falling back to an empty path. */
export function safePathData(path: unknown): string {
  return isSafePathData(path) ? path : "M 0 0";
}
