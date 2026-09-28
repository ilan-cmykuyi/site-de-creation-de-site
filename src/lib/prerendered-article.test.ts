import { describe, expect, it } from "vitest";
import type { PrerenderedArticle } from "../types/site-content";
import { PRERENDERED_ARTICLE_ID, readPrerenderedArticle } from "./prerendered-article";

const ARTICLE: PrerenderedArticle = {
  slug: "fuite-sous-evier",
  title: "Fuite sous l'évier",
  excerpt: null,
  cover: null,
  publishedAt: "2026-09-21T08:00:00.000Z",
  seoTitle: null,
  seoDescription: null,
  bodyHtml: "<p>Coupez l'arrivée d'eau.</p>",
};

/** Document réduit à getElementById : l'élément PRERENDERED_ARTICLE_ID a pour texte `text`, absent si null. */
function pageWith(text: string | null) {
  return {
    getElementById: (id: string) => (text !== null && id === PRERENDERED_ARTICLE_ID ? { textContent: text } : null),
  };
}

describe("readPrerenderedArticle", () => {
  it("renvoie null quand la page n'embarque aucun article (élément absent)", () => {
    expect(readPrerenderedArticle(pageWith(null))).toBeNull();
  });

  it("renvoie null quand le JSON est illisible", () => {
    expect(readPrerenderedArticle(pageWith(""))).toBeNull();
    expect(readPrerenderedArticle(pageWith('{"slug":"fuite-sous-evier",'))).toBeNull();
  });

  it("renvoie null quand le JSON n'est pas un article", () => {
    for (const text of ["null", "42", "[]", '{"slug":"fuite-sous-evier"}', '{"slug":"fuite-sous-evier","title":"Fuite","bodyHtml":1}']) {
      expect(readPrerenderedArticle(pageWith(text))).toBeNull();
    }
  });

  it("lit l'article embarqué, chevrons écrits \\u003c compris", () => {
    const article = { ...ARTICLE, bodyHtml: "<p>Coupez l'eau.</p><script>alert(1)</script>" };
    const text = JSON.stringify(article).replace(/</g, "\\u003c");
    expect(text).not.toContain("<");
    expect(readPrerenderedArticle(pageWith(text))).toStrictEqual(article);
  });
});
