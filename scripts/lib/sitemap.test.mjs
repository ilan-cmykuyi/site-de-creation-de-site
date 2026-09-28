import { describe, expect, it } from "vitest";
import { buildRobotsTxt, buildSitemapXml, siteBaseUrl } from "./sitemap.mjs";

const BASE_URL = "https://plomberie-martin.fr";
const STANDARD_SECTIONS = { hero: {}, testimonials: {}, nav: {}, footer: {}, legal: {} };

/** Contenu publié (forme de src/content.snapshot.json). */
function siteContent({ domains = ["plomberie-martin.fr", "www.plomberie-martin.fr"], sections = STANDARD_SECTIONS, articles = [] } = {}) {
  return {
    site: { name: "Plomberie Martin", domains, settings: {}, publishedAt: "2026-09-25T11:12:30.331Z" },
    sections,
    articles,
  };
}

function article(slug, publishedAt) {
  return { slug, title: slug, excerpt: null, cover: null, publishedAt, seoTitle: null, seoDescription: null };
}

/** Entrées <url> du sitemap, dans l'ordre : adresse et date de modification éventuelle. */
function urlEntries(xml) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
    loc: /<loc>([^<]*)<\/loc>/.exec(body)?.[1],
    lastmod: /<lastmod>([^<]*)<\/lastmod>/.exec(body)?.[1],
  }));
}

describe("buildSitemapXml", () => {
  it("liste l'accueil, le blog, chaque article et les mentions légales, datant les articles", () => {
    const content = siteContent({
      articles: [article("fuite-sous-evier", "2026-09-20T08:00:00.000Z"), article("choisir-son-chauffe-eau", null)],
    });
    expect(urlEntries(buildSitemapXml(content, BASE_URL))).toStrictEqual([
      { loc: "https://plomberie-martin.fr/", lastmod: undefined },
      { loc: "https://plomberie-martin.fr/blog", lastmod: undefined },
      { loc: "https://plomberie-martin.fr/blog/fuite-sous-evier", lastmod: "2026-09-20T08:00:00.000Z" },
      { loc: "https://plomberie-martin.fr/blog/choisir-son-chauffe-eau", lastmod: undefined },
      { loc: "https://plomberie-martin.fr/mentions-legales", lastmod: undefined },
    ]);
  });

  it("n'a pas de /mentions-legales quand le contenu n'a pas de section legal", () => {
    const content = siteContent({ sections: { hero: {}, nav: {}, footer: {} } });
    expect(urlEntries(buildSitemapXml(content, BASE_URL)).map((entry) => entry.loc)).toStrictEqual([
      "https://plomberie-martin.fr/",
      "https://plomberie-martin.fr/blog",
    ]);
  });

  it("échappe & en entité XML", () => {
    const xml = buildSitemapXml(siteContent({ articles: [article("devis&tarifs", null)] }), BASE_URL);
    expect(xml).toContain("<loc>https://plomberie-martin.fr/blog/devis&amp;tarifs</loc>");
    expect(xml).not.toContain("devis&tarifs");
  });

  it("produit un urlset au format sitemaps.org", () => {
    const xml = buildSitemapXml(siteContent(), BASE_URL);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')).toBe(true);
    expect(xml.trimEnd().endsWith("</urlset>")).toBe(true);
  });
});

describe("buildRobotsTxt", () => {
  it("autorise tout et donne l'adresse du sitemap", () => {
    expect(buildRobotsTxt(BASE_URL)).toBe("User-agent: *\nAllow: /\n\nSitemap: https://plomberie-martin.fr/sitemap.xml\n");
  });
});

describe("siteBaseUrl", () => {
  it("prend le premier domaine du site, en https", () => {
    expect(siteBaseUrl(siteContent())).toBe("https://plomberie-martin.fr");
  });

  it("renvoie null quand le site n'a aucun domaine", () => {
    expect(siteBaseUrl(siteContent({ domains: [] }))).toBeNull();
  });
});
