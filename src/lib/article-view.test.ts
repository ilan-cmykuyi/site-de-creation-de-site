import { describe, expect, it } from "vitest";
import type { Article } from "../types/site-content";
import { articleView, type ArticleFetch } from "./article-view";

function article(bodyHtml: string): Article {
  return { slug: "fuite-sous-evier", title: "Fuite sous l'évier", excerpt: null, cover: null, publishedAt: null, seoTitle: null, seoDescription: null, bodyHtml };
}

const PRERENDERED = article("<p>Version du build</p>");
const FROM_API = article("<p>Version en ligne</p>");
const SLUG = "fuite-sous-evier";

function fetched(result: ArticleFetch["result"], slug = SLUG): ArticleFetch {
  return { slug, result };
}

describe("articleView", () => {
  it("affiche l'article embarqué dans la page tout de suite, en attendant l'API", () => {
    expect(articleView(SLUG, null, PRERENDERED, true)).toStrictEqual({ status: "ready", article: PRERENDERED });
  });

  it("remplace l'article embarqué par la réponse de l'API", () => {
    expect(articleView(SLUG, fetched({ status: "ready", article: FROM_API }), PRERENDERED, true)).toStrictEqual({ status: "ready", article: FROM_API });
  });

  it("garde l'article embarqué quand l'API est injoignable (réseau, CORS, erreur serveur)", () => {
    expect(articleView(SLUG, fetched({ status: "failed" }), PRERENDERED, true)).toStrictEqual({ status: "ready", article: PRERENDERED });
  });

  it("n'affiche plus l'article embarqué que l'API dit introuvable (dépublié depuis le build)", () => {
    expect(articleView(SLUG, fetched({ status: "not_found" }), PRERENDERED, true)).toStrictEqual({ status: "error" });
  });

  it("sans article embarqué (arrivée par un lien du site, corps manquant au build) : chargement, puis l'article ou une erreur", () => {
    expect(articleView(SLUG, null, null, true)).toStrictEqual({ status: "loading" });
    expect(articleView(SLUG, fetched({ status: "failed" }), null, true)).toStrictEqual({ status: "error" });
    expect(articleView(SLUG, fetched({ status: "not_found" }), null, true)).toStrictEqual({ status: "error" });
  });

  it("sans jeton public (rien à charger) : l'article embarqué s'il existe, sinon une erreur", () => {
    expect(articleView(SLUG, null, PRERENDERED, false)).toStrictEqual({ status: "ready", article: PRERENDERED });
    expect(articleView(SLUG, null, null, false)).toStrictEqual({ status: "error" });
  });

  it("ignore la réponse d'un autre article (navigation d'article en article)", () => {
    expect(articleView(SLUG, fetched({ status: "not_found" }, "autre-article"), PRERENDERED, true)).toStrictEqual({ status: "ready", article: PRERENDERED });
    expect(articleView(SLUG, fetched({ status: "ready", article: FROM_API }, "autre-article"), null, true)).toStrictEqual({ status: "loading" });
  });
});
