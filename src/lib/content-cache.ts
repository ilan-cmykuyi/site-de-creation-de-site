// src/lib/content-cache.ts
//
// Dernier contenu affiché avec succès dans ce navigateur, pour repartir de
// lui au prochain chargement plutôt que de l'instantané figé au build (qui
// clignote une fraction de seconde avant d'être remplacé par le contenu
// frais). Clé par jeton public : un même poste peut avoir ouvert plusieurs
// sites Booster au fil du temps. Repris seulement s'il tient une publication
// plus récente que l'instantané de build, donc que la page prérendue
// (isCacheNewer) : une page arrivée à jour n'est jamais remplacée par un
// contenu plus ancien.
//
// Jamais pour un aperçu (?preview=) : un brouillon ne doit ni repartir de ce
// cache au chargement suivant, ni écraser le contenu publié qui s'y trouve.
// C'est l'appelant (useSiteContent) qui ne lit ni n'écrit ce cache quand un
// jeton d'aperçu est présent ; l'aperçu garde son propre stockage
// (sessionStorage du jeton, voir lib/preview.ts), sans rapport avec celui-ci.
//
// localStorage peut être indisponible (navigation privée stricte, quota
// dépassé) ou contenir une valeur imprévue (ancienne version du site,
// contenu tronqué) : toute lecture ou écriture est protégée par try/catch,
// un échec retombe silencieusement sur l'instantané de build.
import { siteConfig } from "../../site.config";
import type { SiteContent } from "../types/site-content";

// Clé répétée telle quelle par le script anti-clignotement d'index.html
// (« lea-site-content:v1: » + jeton) : changer l'une, c'est changer l'autre.
function cacheKey(): string {
  return `lea-site-content:v1:${siteConfig.publicToken}`;
}

// Même contrôle de forme que scripts/fetch-content.mjs côté pré-build : on ne
// vérifie que la présence des trois clés de premier niveau, pas leur contenu
// (ce n'est pas un analyseur de schéma, juste un filtre contre une valeur
// clairement inexploitable).
function looksLikeSiteContent(value: unknown): value is SiteContent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Boolean(candidate.site) && Boolean(candidate.sections) && Array.isArray(candidate.articles);
}

/** Contenu du dernier chargement réussi dans ce navigateur, ou null (absent, illisible, invalide, storage indisponible). */
export function readCachedContent(): SiteContent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey());
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return looksLikeSiteContent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Le cache tient-il une publication (`site.publishedAt`) plus récente que
 * l'instantané de build, celle de la page prérendue ? Sinon il est ignoré.
 * Même règle que le script anti-clignotement d'index.html : un cache sans
 * date lisible n'est jamais plus récent ; un instantané sans date l'est
 * moins que tout cache daté.
 */
export function isCacheNewer(cached: SiteContent, snapshot: SiteContent): boolean {
  return Date.parse(cached.site.publishedAt ?? "") > (Date.parse(snapshot.site.publishedAt ?? "") || 0);
}

/** Mémorise le contenu affiché avec succès, pour le prochain chargement. Échec silencieux (quota dépassé, storage indisponible). */
export function writeCachedContent(content: SiteContent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(), JSON.stringify(content));
  } catch {
    // Quota dépassé ou storage indisponible : le prochain chargement repart
    // du snapshot de build, comme si ce cache n'avait jamais existé.
  }
}
