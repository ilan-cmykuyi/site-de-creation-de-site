// src/lib/prerendered-article.ts
//
// Article embarqué dans sa page prérendue. Les corps des articles ne sont
// jamais dans le JavaScript du navigateur (ils alourdiraient chaque page du
// site) : chaque page d'article porte le sien, dans
// <script type="application/json" id="prerender-article">, écrit au build
// par injectPage (scripts/lib/prerender.mjs) avec l'article que le rendu
// serveur a reçu (render(url, { article }), src/entry-server.tsx).
// src/main.tsx le lit ici, une fois, avant l'hydratation, et le passe à
// SiteContentProvider : le premier rendu de la page est alors celui du
// serveur. Testé par prerendered-article.test.ts et, avec l'écriture, par
// scripts/lib/prerender.test.mjs.
import type { PrerenderedArticle } from "../types/site-content";

/** Identifiant du script JSON, le même dans scripts/lib/prerender.mjs : changer l'un, c'est changer l'autre. */
export const PRERENDERED_ARTICLE_ID = "prerender-article";

/** Ce que readPrerenderedArticle demande au document (le vrai document dans le navigateur). */
type PageDocument = { getElementById(id: string): { textContent: string | null } | null };

// Contrôle de forme minimal, comme looksLikeSiteContent (lib/content-cache.ts) :
// ce que la page d'un article lit sans condition.
function looksLikeArticle(value: unknown): value is PrerenderedArticle {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.slug === "string" && typeof candidate.title === "string" && typeof candidate.bodyHtml === "string";
}

/**
 * Article embarqué dans la page, ou null : élément absent (page qui n'est
 * pas celle d'un article, article sans corps au build, serveur de dev), JSON
 * illisible, ou JSON qui n'a pas la forme d'un article.
 */
export function readPrerenderedArticle(page: PageDocument = document): PrerenderedArticle | null {
  const text = page.getElementById(PRERENDERED_ARTICLE_ID)?.textContent;
  if (!text) return null;
  try {
    const value: unknown = JSON.parse(text);
    return looksLikeArticle(value) ? value : null;
  } catch {
    return null;
  }
}
