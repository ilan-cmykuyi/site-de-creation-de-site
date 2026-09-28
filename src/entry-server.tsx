// src/entry-server.tsx
//
// Rendu serveur d'une adresse du site, pour le prérendu au build : compilé
// par `vite build --ssr` dans dist-ssr/ (jamais déployé), appelé par
// scripts/prerender.mjs pour chaque page. Même arbre que src/main.tsx, avec
// StaticRouter à la place de BrowserRouter et un collecteur pour les balises
// de tête (lib/head.ts). Rien ici ne lit window, document ni le stockage :
// le rendu part de l'instantané de build, comme le premier rendu du
// navigateur qui l'hydrate.
//
// Seul module à importer les corps des articles
// (src/content.articles.snapshot.json, écrit par scripts/fetch-content.mjs) :
// ce bundle ne part jamais dans le navigateur. Importés ailleurs, ils
// entreraient dans le JavaScript de chaque page ; la règle ESLint
// no-restricted-imports l'interdit (eslint.config.js).
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { siteConfig } from "../site.config";
import { App } from "./App";
import articleBodies from "./content.articles.snapshot.json";
import { SiteContentProvider } from "./hooks/SiteContentProvider";
import { createHeadCollector, HeadCollectorContext, renderHeadTags } from "./lib/head";
import { snapshotContent } from "./lib/snapshot";
import type { PrerenderedArticle } from "./types/site-content";

/** Jeton public du site, celui du bundle du navigateur : clé du cache que lit le script anti-clignotement (index.html). */
export const publicToken = siteConfig.publicToken;

/** Une entrée de src/content.articles.snapshot.json (scripts/lib/article-bodies.mjs). */
type ArticleBody = { slug: string; bodyHtml: string };

// Typé par annotation, comme snapshotContent (lib/snapshot.ts) : tsc refuse
// un fichier d'une autre forme.
const bodies: ArticleBody[] = articleBodies;

/**
 * Article `slug` de l'instantané avec son corps, à passer à render() et à
 * écrire dans sa page (scripts/prerender.mjs) ; null si l'article n'est pas
 * dans l'instantané ou si son corps n'a pas pu être lu au build (sa page est
 * alors prérendue avec son titre et sa description, en attendant l'API).
 */
export function prerenderedArticle(slug: string): PrerenderedArticle | null {
  const summary = snapshotContent.articles.find((article) => article.slug === slug);
  const body = bodies.find((entry) => entry.slug === slug);
  return summary && body ? { ...summary, bodyHtml: body.bodyHtml } : null;
}

/**
 * HTML de la page `url` pour <div id="root">, et ses balises de tête (titre,
 * meta, canonique, JSON-LD), une par ligne. `article` : l'article d'une page
 * d'article, que scripts/prerender.mjs écrit aussi dans la page ; src/main.tsx
 * l'y relit et le passe à SiteContentProvider par la même prop, pour un
 * premier rendu identique.
 */
export function render(url: string, { article = null }: { article?: PrerenderedArticle | null } = {}): { html: string; head: string } {
  const head = createHeadCollector();
  const html = renderToString(
    <StrictMode>
      <HeadCollectorContext.Provider value={head.collect}>
        <StaticRouter location={url}>
          <SiteContentProvider initialArticle={article}>
            <App />
          </SiteContentProvider>
        </StaticRouter>
      </HeadCollectorContext.Provider>
    </StrictMode>,
  );
  return { html, head: renderHeadTags(head.tags()) };
}
