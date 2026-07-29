import { z } from "zod";

// Where an invalid/absent/malicious `next` param falls back to. Chosen over
// "/" because the gate is only ever reached from a browsing context, and
// "/search" is the app's browsing home.
export const FALLBACK_NEXT_PATH = "/search";

// A fixed, never-dereferenced origin used purely as the base for `new URL()`
// so a relative `next` value can be resolved and inspected. Any value that
// changes the resulting origin (a protocol-relative "//host", an absolute
// "https://host", a "javascript:" scheme, or a backslash trick browsers
// normalize to "//host") is therefore an open-redirect attempt and rejected.
const RESOLUTION_BASE = "http://internal.invalid";

function isSameOriginPath(value: string): boolean {
  if (value.length === 0) return false;
  // Reject anything that doesn't start with exactly one leading slash before
  // even attempting to resolve it — "//evil.com" and "https://evil.com" both
  // fail this outright, and it also rules out scheme-relative values that
  // `new URL` would otherwise happily resolve against the base.
  if (!value.startsWith("/") || value.startsWith("//")) return false;

  let resolved: URL;
  try {
    resolved = new URL(value, RESOLUTION_BASE);
  } catch {
    return false;
  }
  return resolved.origin === RESOLUTION_BASE;
}

const nextPathSchema = z.string().refine(isSameOriginPath, {
  message: 'next must be a same-origin path starting with a single "/"',
});

/**
 * Validates the `next` redirect-target query param used by `/verify` against
 * open-redirect abuse. Only same-origin paths beginning with a single "/"
 * are accepted; anything else (absent, empty, protocol-relative, absolute,
 * or a non-http(s) scheme) falls back to `FALLBACK_NEXT_PATH`.
 */
export function parseNextPath(rawNext: string | null | undefined): string {
  if (rawNext === null || rawNext === undefined) return FALLBACK_NEXT_PATH;
  const result = nextPathSchema.safeParse(rawNext);
  return result.success ? result.data : FALLBACK_NEXT_PATH;
}
