// src/lib/structured-data.ts
//
// Données structurées schema.org (JSON-LD) du site : un LocalBusiness tiré
// des sections standard (nav, footer, legal) et de l'image de partage du
// site. Fonctions pures, sans DOM : components/StructuredData.tsx pose le
// résultat dans <head>. Les sections sont lues par déstructuration directe
// de content.sections, la forme que scripts/check-schema.mjs sait vérifier ;
// chaque valeur est revérifiée ici (texte non vide, adresse http), le
// contenu pouvant venir d'un cache navigateur.
import type { SiteContent } from "../types/site-content";
import { siteShareImage } from "./seo";

export type PostalAddress = {
  "@type": "PostalAddress";
  streetAddress?: string;
  postalCode?: string;
  addressLocality?: string;
  addressCountry: "FR";
};

export type LocalBusiness = {
  "@context": "https://schema.org";
  "@type": "LocalBusiness";
  name?: string;
  legalName?: string;
  url?: string;
  telephone?: string;
  email?: string;
  address?: PostalAddress;
  image?: string;
  sameAs?: string[];
};

// Section absente du contenu (site branché avant son ajout) : rien à lire.
const NO_VALUES: Record<string, unknown> = {};
// Dernière ligne d'une adresse française : code postal, puis ville.
const POSTAL_LINE_RE = /^(\d{5})\s+(.+)$/;
const HTTP_URL_RE = /^https?:\/\//i;

/** Texte saisi, sans espaces de bord ; undefined s'il est vide ou si ce n'est pas du texte. */
function text(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

/**
 * footer.address (une ligne par retour à la ligne) en PostalAddress : si la
 * dernière ligne est « code postal ville », elle donne postalCode et
 * addressLocality, et les lignes d'avant, jointes par une virgule, la rue ;
 * sinon toute l'adresse va dans streetAddress.
 */
function postalAddress(value: unknown): PostalAddress | undefined {
  const lines = (text(value) ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return undefined;
  const postal = POSTAL_LINE_RE.exec(lines[lines.length - 1]);
  const streetLines = postal ? lines.slice(0, -1) : lines;
  return {
    "@type": "PostalAddress",
    ...(streetLines.length > 0 && { streetAddress: streetLines.join(", ") }),
    ...(postal && { postalCode: postal[1], addressLocality: postal[2] }),
    addressCountry: "FR",
  };
}

/** Adresses http(s) des réseaux sociaux du pied de page (un mailto: ou un lien relatif n'est pas un profil). */
function socialProfileUrls(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: unknown) => text((item as { url?: unknown } | null)?.url))
    .filter((url): url is string => url !== undefined && HTTP_URL_RE.test(url));
}

/**
 * LocalBusiness du site, ou null s'il n'a ni nom, ni téléphone, ni adresse
 * (rien d'utile à décrire). Les clés vides sont omises. `baseUrl` : voir
 * siteBaseUrl (lib/seo.ts), null quand le site n'a pas de domaine.
 */
export function buildLocalBusiness(content: SiteContent, baseUrl: string | null): LocalBusiness | null {
  const { brandName } = content.sections.nav ?? NO_VALUES;
  const { phone, email, address, socials } = content.sections.footer ?? NO_VALUES;
  const { companyName } = content.sections.legal ?? NO_VALUES;

  const name = text(brandName) ?? text(content.site.name);
  const telephone = text(phone);
  const postal = postalAddress(address);
  if (!name && !telephone && !postal) return null;

  const sameAs = socialProfileUrls(socials);
  const business: LocalBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    legalName: text(companyName),
    url: baseUrl ?? undefined,
    telephone,
    email: text(email),
    address: postal,
    image: siteShareImage(content)?.url,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  };
  return Object.fromEntries(Object.entries(business).filter(([, value]) => value !== undefined)) as LocalBusiness;
}

/**
 * JSON à poser dans <script type="application/ld+json">. `<` est écrit
 * `\u003c` (même valeur une fois le JSON lu) : un texte saisi dans Lea CRM ne
 * peut pas fermer la balise, y compris si la page est un jour pré-rendue en
 * HTML statique.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
