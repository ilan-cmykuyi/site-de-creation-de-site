import { describe, expect, it } from "vitest";
import type { PublicImage, SiteContent } from "../types/site-content";
import { canonicalPath, siteBaseUrl, siteShareImage } from "./seo";

const HERO_PHOTO: PublicImage = { url: "https://cdn.example.com/bandeau.jpg", alt: "Camionnette de l'entreprise", width: 2000, height: 424 };
const SHARE_PHOTO: PublicImage = { url: "https://cdn.example.com/partage.jpg", alt: null, width: 1200, height: 630 };

function siteContent(settings: SiteContent["site"]["settings"], sections: SiteContent["sections"]): SiteContent {
  return {
    site: { name: "Plomberie Martin", domains: ["plomberie-martin.fr"], settings, publishedAt: null },
    sections,
    articles: [],
  };
}

describe("siteBaseUrl", () => {
  it("prend le premier domaine du site, en https", () => {
    expect(siteBaseUrl(["plomberie-martin.fr", "www.plomberie-martin.fr"])).toBe("https://plomberie-martin.fr");
  });

  it("renvoie null quand le site n'a aucun domaine", () => {
    expect(siteBaseUrl([])).toBeNull();
  });
});

describe("canonicalPath", () => {
  it("retire le slash final d'une page : /blog/ et /blog sont la même adresse", () => {
    expect(canonicalPath("/blog/")).toBe("/blog");
    expect(canonicalPath("/blog/mon-article/")).toBe("/blog/mon-article");
  });

  it("garde l'accueil tel quel", () => {
    expect(canonicalPath("/")).toBe("/");
  });

  it("laisse inchangé un chemin sans slash final", () => {
    expect(canonicalPath("/mentions-legales")).toBe("/mentions-legales");
  });
});

describe("siteShareImage", () => {
  it("préfère l'image de partage réglée dans Lea CRM à la photo du bandeau", () => {
    const content = siteContent({ seo: { ogImage: SHARE_PHOTO } }, { hero: { image: HERO_PHOTO } });
    expect(siteShareImage(content)).toBe(SHARE_PHOTO);
  });

  it("prend la photo du bandeau quand aucune image de partage n'est réglée", () => {
    const content = siteContent({ seo: { titleSuffix: " | Plomberie Martin" } }, { hero: { image: HERO_PHOTO } });
    expect(siteShareImage(content)).toBe(HERO_PHOTO);
  });

  it("ne renvoie rien sans image de partage ni photo du bandeau", () => {
    expect(siteShareImage(siteContent({}, { hero: { title: "Dépannage 7j/7", image: null } }))).toBeUndefined();
    expect(siteShareImage(siteContent({}, {}))).toBeUndefined();
  });
});
