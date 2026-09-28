import { afterEach, describe, expect, it, vi } from "vitest";
import { formatDate } from "./format";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("formatDate", () => {
  it("donne le même jour au prérendu (machine de build en UTC) et dans le navigateur : l'heure de Paris", () => {
    // 23 h 30 UTC le 20 septembre = 1 h 30 le 21 septembre à Paris.
    vi.stubEnv("TZ", "UTC");
    expect(formatDate("2026-09-20T23:30:00.000Z")).toBe("21 septembre 2026");
    vi.stubEnv("TZ", "America/New_York");
    expect(formatDate("2026-09-20T23:30:00.000Z")).toBe("21 septembre 2026");
  });

  it("renvoie null pour une date absente ou invalide", () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate("pas une date")).toBeNull();
  });
});
