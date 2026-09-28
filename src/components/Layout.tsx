// src/components/Layout.tsx
import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router";
import { useSiteMeta } from "../hooks/site-content-context";
import { ui } from "../ui-strings";
import { ConsentBanner } from "./ConsentBanner";
import { Footer } from "./Footer";
import { Nav } from "./Nav";
import { StructuredData } from "./StructuredData";

/**
 * Position de défilement quand l'adresse change, deux cas que le navigateur
 * ne gère pas seul dans une application monopage :
 * - changement de page : React Router garde la position courante, et un clic
 *   sur « Mentions légales », tout en bas, ouvrirait la page suivante au même
 *   niveau. On remonte en haut, sauf au premier affichage (le navigateur
 *   restaure lui-même la position d'un rechargement) ;
 * - adresse avec ancre (/#contact, depuis le menu d'une autre page) : le site
 *   est rechargé et la section visée n'existe pas encore quand le navigateur
 *   la cherche, la page restait donc en haut. On la fait défiler après le
 *   rendu, premier affichage compris.
 */
function useScrollOnNavigation() {
  const { pathname, hash } = useLocation();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    const isFirstRender = previousPathname.current === null;
    const pageChanged = previousPathname.current !== pathname;
    previousPathname.current = pathname;
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }
    if (pageChanged && !isFirstRender) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);
}

/** Chrome commun : bandeau d'aperçu, en-tête et menu, pied de page, bannière de consentement, données structurées (JSON-LD). */
export function Layout({ children }: { children: ReactNode }) {
  const { isPreview } = useSiteMeta();
  useScrollOnNavigation();

  return (
    <div className="flex min-h-screen flex-col">
      {isPreview && (
        <div role="status" className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
          {ui.preview.badge}
        </div>
      )}
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
      <ConsentBanner />
      <StructuredData />
    </div>
  );
}
