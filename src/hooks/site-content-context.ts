// src/hooks/site-content-context.ts
//
// Contexte partagé + hooks de lecture. Le composant <SiteContentProvider>
// (fichier voisin) appelle useSiteContent() une seule fois en haut de l'arbre ;
// les sections lisent leur contenu avec useSection(), les pages avec
// useSiteMeta(), et ce qui a besoin de tout le contenu (image de partage,
// données structurées) avec useFullSiteContent(). La page d'un article lit
// l'article embarqué dans la page prérendue avec usePrerenderedArticle().
// Séparé du Provider pour que le rechargement à chaud de Vite (react-refresh)
// garde un fichier qui n'exporte qu'un composant.
import { createContext, useContext } from "react";
import type { PrerenderedArticle, SiteContent } from "../types/site-content";
import type { UseSiteContentResult } from "./useSiteContent";

export const SiteContentContext = createContext<UseSiteContentResult | null>(null);

/**
 * Article embarqué dans la page prérendue (lu par src/main.tsx avant
 * l'hydratation), ou passé au rendu serveur de cette page
 * (src/entry-server.tsx) : le même des deux côtés. null ailleurs. Fourni par
 * SiteContentProvider (prop `initialArticle`), fixe pendant toute la visite.
 */
export const PrerenderedArticleContext = createContext<PrerenderedArticle | null>(null);

function useSiteContentContext(): UseSiteContentResult {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error("useSection/useSiteMeta doit être utilisé sous <SiteContentProvider>");
  return ctx;
}

/**
 * Accès typé à une section : `useSection<Hero>("hero")`. Toujours appeler
 * avec une clé littérale (jamais une variable) et toujours déstructurer ou
 * chaîner directement le résultat : c'est ce que scripts/check-schema.mjs
 * sait vérifier (voir CLAUDE.md).
 */
export function useSection<T extends Record<string, unknown> = Record<string, unknown>>(key: string): T {
  const { content } = useSiteContentContext();
  return (content.sections[key] ?? {}) as T;
}

/**
 * Nom du site, domaines, réglages, liste des articles, état d'aperçu/fraîcheur.
 * `browserStateApplied` : jeton d'aperçu et cache du navigateur lus (faux au
 * prérendu et au premier rendu du navigateur). Ce qui dépend du jeton ou de
 * l'adresse réelle attend qu'il soit vrai : l'article d'un aperçu, la page
 * vue du suivi (le jeton quitte l'adresse à sa lecture, lib/preview.ts).
 */
export function useSiteMeta() {
  const { content, isPreview, isFresh, previewToken, browserStateApplied } = useSiteContentContext();
  return { site: content.site, articles: content.articles, isPreview, isFresh, previewToken, browserStateApplied };
}

/**
 * Contenu complet (site, toutes les sections, articles), pour une fonction
 * qui le lit en entier : siteShareImage (lib/seo.ts), buildLocalBusiness
 * (lib/structured-data.ts). Ces fonctions lisent leurs sections par
 * déstructuration de content.sections, la forme que check-schema vérifie ;
 * un composant de section, lui, lit la sienne avec useSection().
 */
export function useFullSiteContent(): SiteContent {
  return useSiteContentContext().content;
}

/**
 * L'article embarqué dans la page prérendue si c'est celui de `slug`, sinon
 * null : page arrivée par une navigation dans le site (autre article), page
 * sans article embarqué (serveur de dev, article sans corps au build).
 */
export function usePrerenderedArticle(slug: string): PrerenderedArticle | null {
  const article = useContext(PrerenderedArticleContext);
  return article?.slug === slug ? article : null;
}
