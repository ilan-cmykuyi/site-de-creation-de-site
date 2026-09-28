// src/lib/seo.ts
//
// Adresse et image de partage du site, communes aux balises de <SiteHead>
// (canonique, Open Graph) et aux données structurées
// (lib/structured-data.ts). scripts/lib/sitemap.mjs applique la même règle
// d'adresse côté Node, au post-build.
import type { PublicImage, SiteContent } from "../types/site-content";

// Section absente du contenu (site branché avant son ajout) : rien à lire.
const NO_VALUES: Record<string, unknown> = {};

/** `https://<premier domaine du site>`, ou null si le site n'a aucun domaine (Lea CRM, Réglages du site > Domaines). */
export function siteBaseUrl(domains: string[]): string | null {
  const domain = domains[0];
  return domain ? `https://${domain}` : null;
}

/**
 * Chemin de la canonique : celui de la page sans slash final (`/blog/` et
 * `/blog` sont la même page, une seule adresse pour les moteurs), sauf
 * l'accueil, qui reste `/`.
 */
export function canonicalPath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

function isPublicImage(value: unknown): value is PublicImage {
  return typeof value === "object" && value !== null && typeof (value as { url?: unknown }).url === "string";
}

/**
 * Image de partage du site : celle choisie dans Lea CRM (settings.seo.ogImage),
 * sinon la photo du bandeau d'accueil. Un site dont le bandeau change de clé
 * ou de champ adapte la lecture ci-dessous (check-schema la signale).
 */
export function siteShareImage(content: SiteContent): PublicImage | undefined {
  const { image } = content.sections.hero ?? NO_VALUES;
  return content.site.settings.seo?.ogImage ?? (isPublicImage(image) ? image : undefined);
}
