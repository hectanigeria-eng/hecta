import { describe, expect, it } from "vitest";
import { FALLBACK_NEXT_PATH, parseNextPath } from "@/lib/safe-redirect";

describe("parseNextPath", () => {
  it("accepts a normal same-origin path", () => {
    expect(parseNextPath("/listings/abc-123")).toBe("/listings/abc-123");
  });

  it("accepts a same-origin path with a query string", () => {
    expect(parseNextPath("/search?intent=buy&page=2")).toBe(
      "/search?intent=buy&page=2",
    );
  });

  it("accepts a same-origin path with a hash fragment", () => {
    expect(parseNextPath("/listings/abc-123#reviews")).toBe(
      "/listings/abc-123#reviews",
    );
  });

  it("falls back on a protocol-relative path (//evil.com)", () => {
    expect(parseNextPath("//evil.com")).toBe(FALLBACK_NEXT_PATH);
  });

  it("falls back on an absolute URL to another host", () => {
    expect(parseNextPath("https://evil.com")).toBe(FALLBACK_NEXT_PATH);
  });

  it("falls back on a javascript: scheme", () => {
    expect(parseNextPath("javascript:alert(1)")).toBe(FALLBACK_NEXT_PATH);
  });

  it("falls back on a backslash trick browsers normalize to //host", () => {
    expect(parseNextPath("/\\evil.com")).toBe(FALLBACK_NEXT_PATH);
  });

  it("falls back when next is absent", () => {
    expect(parseNextPath(undefined)).toBe(FALLBACK_NEXT_PATH);
    expect(parseNextPath(null)).toBe(FALLBACK_NEXT_PATH);
  });

  it("falls back on an empty string", () => {
    expect(parseNextPath("")).toBe(FALLBACK_NEXT_PATH);
  });

  it("falls back on a path missing its leading slash", () => {
    expect(parseNextPath("search")).toBe(FALLBACK_NEXT_PATH);
  });

  it("falls back on a scheme with no slashes (http:evil.com)", () => {
    expect(parseNextPath("http:evil.com")).toBe(FALLBACK_NEXT_PATH);
  });
});
