// src/components/SiteHead.tsx
import { useEffect } from "react";
import { useLocation } from "react-router";
import { useSiteMeta } from "../hooks/site-content-context";
import { applyHeadTags, metaTag, useHead } from "../lib/head";
import { canonicalPath, siteBaseUrl } from "../lib/seo";
import { injectTrackingIfConsented } from "../lib/tracking";
import type { PublicImage, SiteSettings } from "../types/site-content";
import { ui } from "../ui-strings";

type SiteHeadProps = {
  /**
   * Titre de la page, SANS le suffixe, ajouté ici : settings.seo.titleSuffix
   * (Lea CRM, Réglages du site > Référencement), tel quel, même vide ; absent,
   * « | <nom du site> », sauf quand ce titre EST le nom du site (l'accueil),
   * qui reste seul.
   */
  title: string;
  description?: string;
  /**
   * Image de partage propre à la page (cover d'un article ; pour l'accueil,
   * celle du site ou la photo du bandeau). À défaut, celle du site
   * (settings.seo.ogImage), sinon aucune.
   */
  image?: PublicImage;
  settings: SiteSettings;
  /** Page à ne pas indexer (404) : robots noindex, ni canonique ni og:url. */
  noindex?: boolean;
};

// og:locale s'écrit langue_PAYS : la locale du site (ui.locale, fr-FR) donne fr_FR.
const OG_LOCALE = ui.locale.replace("-", "_");

/**
 * og:url d'un site qui n'a pas de domaine : l'adresse de la page sans query
 * ni ancre. Le chemin est celui du routeur, passé en argument : l'effet qui
 * pose og:url dépend ainsi de `pathname`, la seule partie qui change.
 */
function pageUrlWithoutDomain(pathname: string): string {
  const url = new URL(window.location.href);
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url.href;
}

/**
 * Ne rend rien : déclare (useHead, lib/head.ts) le titre, les balises
 * <meta> (description, Open Graph, Twitter) et <link rel="canonical"> de la
 * page, écrits dans le HTML prérendu au build puis tenus à jour dans le
 * navigateur ; charge ensuite le suivi si le visiteur l'a accepté.
 *
 * Canonique : https://<premier domaine du site><chemin de la page>, sans
 * query ni ancre, sans slash final sauf pour l'accueil (canonicalPath,
 * lib/seo.ts : /blog/ donne /blog) ; aucune si le site n'a pas de domaine
 * (Lea CRM, Réglages du site > Domaines). og:url reprend la canonique ; sans
 * domaine, l'adresse courante sans query ni ancre, que seul le navigateur
 * connaît : posée par effet, jamais écrite au prérendu.
 *
 * Suivi : seulement une fois le navigateur lu (`browserStateApplied`), quand
 * le jeton d'aperçu a quitté l'adresse (lib/preview.ts) ; une page vue ne
 * part jamais avec `?preview=`. Une par page (lib/tracking.ts), quel que
 * soit le nombre de rendus.
 */
export function SiteHead({ title, description, image, settings, noindex = false }: SiteHeadProps) {
  const { site, browserStateApplied } = useSiteMeta();
  const { pathname } = useLocation();
  // Suffixe explicite (même vide) : tel quel. Absent : le nom du site, sauf
  // pour une page dont le titre est déjà ce nom (l'accueil), jamais « Nom | Nom ».
  const titleSuffix = settings.seo?.titleSuffix ?? (title === site.name ? "" : ` | ${site.name}`);
  const fullTitle = `${title}${titleSuffix}`;
  const desc = description ?? settings.seo?.defaultDescription ?? "";
  const shareImage = image ?? settings.seo?.ogImage;
  const imageUrl = shareImage?.url;
  const baseUrl = siteBaseUrl(site.domains);
  const canonical = baseUrl && !noindex ? `${baseUrl}${canonicalPath(pathname)}` : undefined;

  // og:url : la canonique, retirée d'une page noindex ; sans domaine, pas
  // déclarée ici, l'effet ci-dessous la pose.
  const ogUrlFromBrowser = !baseUrl && !noindex;

  useHead([
    { kind: "title", text: fullTitle },
    metaTag("name", "description", desc || undefined),
    metaTag("name", "robots", noindex ? "noindex" : undefined),
    metaTag("property", "og:title", fullTitle),
    metaTag("property", "og:description", desc || undefined),
    metaTag("property", "og:type", "website"),
    metaTag("property", "og:locale", OG_LOCALE),
    ...(ogUrlFromBrowser ? [] : [metaTag("property", "og:url", canonical)]),
    metaTag("property", "og:image", imageUrl),
    metaTag("property", "og:image:width", shareImage?.width?.toString()),
    metaTag("property", "og:image:height", shareImage?.height?.toString()),
    metaTag("name", "twitter:card", imageUrl ? "summary_large_image" : "summary"),
    { kind: "canonical", href: canonical },
  ]);

  useEffect(() => {
    if (ogUrlFromBrowser) applyHeadTags([metaTag("property", "og:url", pageUrlWithoutDomain(pathname))]);
    if (browserStateApplied) injectTrackingIfConsented(settings, pathname);
  }, [ogUrlFromBrowser, pathname, settings, browserStateApplied]);

  return null;
}
