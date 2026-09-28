// src/types/site-content.ts
//
// Alignés sur lib/sites/public-content.ts et lib/sites/settings.ts du dépôt
// CRM (vérifié le 2026-09-25 contre la réponse réelle de GET /content). Toute
// divergence de nom de champ casse le rendu en silence (TypeScript ne voit que
// ce fichier, pas l'API réelle) : si l'API change, ce fichier change dans le
// même commit, côté CRM ET côté ce dépôt.
export type SiteSettings = {
  gtmId?: string;
  ga4Id?: string;
  metaPixelId?: string;
  seo?: {
    titleSuffix?: string;
    defaultDescription?: string;
    /**
     * Image de partage du site (Lea CRM, Réglages du site > Référencement),
     * déjà résolue par l'API. Absente tant qu'aucune n'est choisie.
     */
    ogImage?: PublicImage;
  };
  contactForm?: { enabled?: boolean };
};

/** Un champ `image` déjà résolu côté CRM : jamais un identifiant à résoudre ici. */
export type PublicImage = {
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  /**
   * Variantes WebP à largeurs croissantes, prêtes pour l'attribut `srcset` :
   * `"<url> 480w, <url> 960w, …"`. Absent tant qu'aucune variante n'existe (la
   * production ne l'envoie pas encore) ; `url` reste l'image d'origine
   * (og:image, JSON-LD). Voir src/lib/images.ts (imgAttributes) et
   * src/components/ResponsiveImage.tsx.
   */
  srcset?: string;
};

export type ArticleSummary = {
  slug: string;
  title: string;
  excerpt: string | null;
  cover: PublicImage | null;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

/** Renvoyé par GET /articles/:slug : le résumé et son corps. */
export type Article = ArticleSummary & { bodyHtml: string };

/**
 * Article embarqué dans sa page prérendue, corps compris : rendu au build
 * (src/entry-server.tsx, `render(url, { article })`) et écrit dans la page
 * (script JSON, scripts/lib/prerender.mjs), puis lu par src/main.tsx avant
 * l'hydratation (src/lib/prerendered-article.ts). Le même article des deux
 * côtés : le premier rendu du navigateur reproduit le HTML prérendu. Les
 * corps des articles ne sont jamais dans le JavaScript du navigateur.
 */
export type PrerenderedArticle = Article;

export type SiteContent = {
  site: {
    name: string;
    domains: string[];
    settings: SiteSettings;
    publishedAt: string | null;
  };
  // Une entrée par section du site, indexée par sa clé (ex. "hero"). Valeurs
  // déjà validées et résolues côté CRM.
  sections: Record<string, Record<string, unknown>>;
  articles: ArticleSummary[];
};
