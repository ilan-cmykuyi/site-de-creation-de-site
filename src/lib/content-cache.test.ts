import { describe, expect, it } from "vitest";
import type { SiteContent } from "../types/site-content";
import { isCacheNewer } from "./content-cache";

/** Contenu publié le `publishedAt` donné (forme de src/content.snapshot.json et du cache). */
function published(publishedAt: string | null): SiteContent {
  return { site: { name: "Plomberie Martin", domains: [], settings: {}, publishedAt }, sections: {}, articles: [] };
}

const BUILD = published("2026-09-25T11:12:30.331Z");

describe("isCacheNewer", () => {
  it("garde un cache qui tient une publication plus récente que l'instantané (la page prérendue)", () => {
    expect(isCacheNewer(published("2026-09-26T08:00:00.000Z"), BUILD)).toBe(true);
  });

  it("ignore un cache plus ancien que l'instantané : la page arrivée à jour n'est jamais remplacée par l'ancien texte", () => {
    expect(isCacheNewer(published("2026-09-20T08:00:00.000Z"), BUILD)).toBe(false);
  });

  it("ignore un cache de la même publication", () => {
    expect(isCacheNewer(published("2026-09-25T11:12:30.331Z"), BUILD)).toBe(false);
  });

  it("ignore un cache sans date lisible, ou quand aucune date n'est connue", () => {
    expect(isCacheNewer(published(null), BUILD)).toBe(false);
    expect(isCacheNewer(published("pas une date"), BUILD)).toBe(false);
    expect(isCacheNewer(published(null), published(null))).toBe(false);
  });

  it("garde un cache daté quand l'instantané n'a pas de date (même règle que le script anti-clignotement)", () => {
    expect(isCacheNewer(published("2026-09-26T08:00:00.000Z"), published(null))).toBe(true);
  });
});
