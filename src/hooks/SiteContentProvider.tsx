// src/hooks/SiteContentProvider.tsx
import { useEffect, type ReactNode } from "react";
import type { PrerenderedArticle } from "../types/site-content";
import { PrerenderedArticleContext, SiteContentContext } from "./site-content-context";
import { useSiteContent } from "./useSiteContent";

type SiteContentProviderProps = {
  children: ReactNode;
  /**
   * Article embarqué dans la page prérendue, avec son corps : lu par
   * src/main.tsx avant l'hydratation (lib/prerendered-article.ts), passé par
   * src/entry-server.tsx au rendu serveur de la même page. Absent ailleurs.
   */
  initialArticle?: PrerenderedArticle | null;
};

/** Un seul fetch du contenu pour tout l'arbre : à poser une fois dans main.tsx (et src/entry-server.tsx). */
export function SiteContentProvider({ children, initialArticle = null }: SiteContentProviderProps) {
  const value = useSiteContent();
  const { source, browserStateApplied } = value;

  useEffect(() => {
    // Attribut invisible (aucun texte affiché) : provenance du contenu
    // courant (cache/snapshot/live), pour le débogage et les vérifications
    // automatisées uniquement.
    document.documentElement.dataset.contentSource = source;
  }, [source]);

  useEffect(() => {
    // Le script anti-clignotement d'index.html masque la page (classe
    // content-stale) quand le cache de ce navigateur tient une publication
    // plus récente que le HTML prérendu : ce cache vient d'être appliqué
    // (ou écarté, en aperçu), la page peut apparaître.
    if (browserStateApplied) document.documentElement.classList.remove("content-stale");
  }, [browserStateApplied]);

  return (
    <SiteContentContext.Provider value={value}>
      <PrerenderedArticleContext.Provider value={initialArticle}>{children}</PrerenderedArticleContext.Provider>
    </SiteContentContext.Provider>
  );
}
