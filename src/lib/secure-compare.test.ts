import { describe, expect, it } from "vitest";
import { safeEqual } from "@/lib/secure-compare";

describe("safeEqual", () => {
  it("matches identical secrets", () => expect(safeEqual("Bearer abc123", "Bearer abc123")).toBe(true));
  it("rejects a different value of the same length", () => expect(safeEqual("Bearer abc123", "Bearer abc124")).toBe(false));
  it("rejects values of different length without throwing", () => expect(safeEqual("short", "a-much-longer-secret")).toBe(false));
  it("rejects null or empty input", () => {
    expect(safeEqual(null, "secret")).toBe(false);
    expect(safeEqual("secret", undefined)).toBe(false);
    expect(safeEqual("", "")).toBe(false);
  });
});
