// src/lib/article-view.ts
//
// Ce qu'affiche la page d'un article (src/pages/BlogPost.tsx), selon
// l'article embarqué dans la page prérendue et la réponse de
// GET /articles/:slug, et ses balises de tête. Fonctions pures, testées par
// article-view.test.ts et src/pages/BlogPost.test.tsx.
import type { Article, ArticleSummary, PublicImage } from "../types/site-content";
import { ui } from "../ui-strings";

/**
 * Réponse de GET /articles/:slug pour `slug` : l'article ; `not_found` (404 :
 * article dépublié, ou jamais publié) ; `failed` (réseau, CORS, erreur
 * serveur : l'API n'a rien dit de l'article).
 */
export type ArticleFetch = {
  slug: string;
  result: { status: "ready"; article: Article } | { status: "not_found" } | { status: "failed" };
};

export type ArticleView = { status: "loading" } | { status: "error" } | { status: "ready"; article: Article };

/**
 * La réponse de l'API pour cet article, sinon l'article embarqué dans la
 * page prérendue (`prerendered`, lib/prerendered-article.ts), affiché dès le
 * HTML et gardé si l'API est injoignable, sinon le chargement ou une erreur.
 * Un 404 l'emporte sur l'article embarqué : un article dépublié depuis le
 * build ne reste jamais affiché. Sans jeton public (`hasToken` faux), rien ne
 * sera chargé : l'article embarqué ou une erreur. Une réponse d'un autre slug
 * (navigation d'article en article) est ignorée.
 */
export function articleView(slug: string, fetched: ArticleFetch | null, prerendered: Article | null, hasToken: boolean): ArticleView {
  const result = fetched?.slug === slug ? fetched.result : null;
  if (result?.status === "ready") return result;
  if (result?.status === "not_found") return { status: "error" };
  if (prerendered) return { status: "ready", article: prerendered };
  if (result?.status === "failed" || !hasToken) return { status: "error" };
  return { status: "loading" };
}

/** Props de <SiteHead> pour la page d'un article, hors `settings`. */
export type ArticleHead = { title: string; description?: string; image?: PublicImage; noindex: boolean };

/**
 * Balises de tête de la page d'un article, dans chaque branche. L'article
 * affiché donne titre, description, image et canonique ; pendant le
 * chargement, son résumé (`summary`, liste des articles du contenu) : un
 * article dont le corps a manqué au build est prérendu avec ses balises, pas
 * comme une page vide. Chargement d'un article absent de la liste (publié
 * depuis le dernier build, adresse inconnue) : noindex, en attendant. Erreur
 * (dépublié, introuvable, indisponible) : noindex et titre neutre, ni
 * canonique ni og:url ; rien de l'article ne reste indexable.
 */
export function articleHead(view: ArticleView, summary: ArticleSummary | null): ArticleHead {
  if (view.status === "error") return { title: ui.blog.unavailableTitle, noindex: true };
  const shown = view.status === "ready" ? view.article : summary;
  if (!shown) return { title: ui.blog.loading, noindex: true };
  return {
    title: shown.seoTitle ?? shown.title,
    description: shown.seoDescription ?? shown.excerpt ?? undefined,
    image: shown.cover ?? undefined,
    noindex: false,
  };
}
