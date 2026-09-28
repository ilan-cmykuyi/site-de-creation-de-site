// src/hooks/useSiteContent.ts
import { useEffect, useMemo, useState } from "react";
import { fetchPublicJson, hasPublicToken } from "../lib/api";
import { isCacheNewer, readCachedContent, writeCachedContent } from "../lib/content-cache";
import { readPreviewToken } from "../lib/preview";
import { snapshotContent } from "../lib/snapshot";
import type { SiteContent } from "../types/site-content";
import { useBrowserValue } from "./useBrowserValue";

/**
 * Provenance du contenu affiché, pour le débogage seulement (jamais un texte
 * affiché à l'utilisateur) : "cache" = repris du dernier chargement réussi
 * dans ce navigateur, "snapshot" = instantané écrit au build, "live" =
 * réponse fraîche de l'API déjà reçue et affichée.
 */
export type ContentSource = "cache" | "snapshot" | "live";

export type UseSiteContentResult = {
  content: SiteContent;
  /** true dès que ?preview=... était dans l'URL (ou en sessionStorage), que le jeton soit bon ou non. */
  isPreview: boolean;
  /** true une fois que le contenu affiché vient d'un fetch réussi (pas seulement du snapshot de build ou du cache). */
  isFresh: boolean;
  previewToken: string | null;
  source: ContentSource;
  /**
   * true une fois le jeton d'aperçu et le cache du navigateur lus et
   * appliqués ; false au prérendu et au premier rendu du navigateur
   * (hydratation), qui ne montrent que l'instantané de build.
   */
  browserStateApplied: boolean;
};

/**
 * Complète un contenu repris du cache avec les sections qu'il n'a pas et que
 * l'instantané de build connaît. Une section ajoutée au schéma depuis la
 * dernière visite (menu, pied de page, mentions légales...) reste ainsi
 * affichée quand le cache remplace l'instantané, au lieu d'un menu vide le
 * temps que l'API réponde.
 * Une section présente dans le cache garde la valeur du cache.
 */
function withMissingSections(cached: SiteContent, snapshot: SiteContent): SiteContent {
  const missing = Object.keys(snapshot.sections).some((key) => !(key in cached.sections));
  return missing ? { ...cached, sections: { ...snapshot.sections, ...cached.sections } } : cached;
}

/** Ce que le navigateur sait avant tout appel réseau : jeton d'aperçu et dernier contenu affiché (cache). */
type BrowserState = { previewToken: string | null; cached: SiteContent | null; applied: boolean };

/** Prérendu et hydratation : rien du navigateur, l'instantané seul. */
const SERVER_STATE: BrowserState = { previewToken: null, cached: null, applied: false };

let browserState: BrowserState | null = null;

/**
 * Jeton d'aperçu puis, hors aperçu, cache (lib/content-cache.ts) : lus une
 * seule fois par chargement de page (le jeton quitte l'URL dès sa première
 * lecture, voir lib/preview.ts) et mémorisés, pour que useBrowserValue
 * reçoive toujours le même objet. Le cache n'est gardé que s'il tient une
 * publication plus récente que l'instantané, celle de la page prérendue
 * (isCacheNewer) : plus ancien, il remplacerait le texte à jour par l'ancien.
 * Un aperçu ne repart jamais de ce cache : voir lib/content-cache.ts.
 */
function readBrowserState(): BrowserState {
  if (!browserState) {
    const previewToken = readPreviewToken();
    const cached = previewToken ? null : readCachedContent();
    browserState = { previewToken, cached: cached && isCacheNewer(cached, snapshotContent) ? cached : null, applied: true };
  }
  return browserState;
}

/**
 * Contenu du site.
 *
 * Premier rendu, au prérendu comme dans le navigateur (hydratation) :
 * l'instantané de build seul, pour que le navigateur reproduise exactement
 * le HTML prérendu. Aussitôt après (useBrowserValue) : le jeton d'aperçu et,
 * hors aperçu, le dernier contenu affiché avec succès dans ce navigateur
 * (cache), s'il tient une publication plus récente que le HTML prérendu,
 * complété des sections qui lui manquent ; le script anti-clignotement
 * d'index.html garde alors la page masquée jusque-là (voir
 * SiteContentProvider). Un cache plus ancien ou de la même publication est
 * ignoré.
 *
 * Ensuite, un fetch : avec un jeton d'aperçu, sans cache vers
 * /content?preview=... ; sinon vers /content. La réponse remplace le contenu
 * affiché et passe `source` à "live" ; hors aperçu, elle est aussi mémorisée
 * dans le cache pour le prochain chargement. Toute erreur (réseau, CORS,
 * jeton d'aperçu invalide, JSON invalide) est ignorée : le site reste sur le
 * dernier contenu connu, jamais de page blanche à cause d'une panne de l'API,
 * et le cache n'est pas modifié.
 *
 * Un jeton d'aperçu faux donne 404 pour toute la requête (pas de repli sur le
 * publié) : un aperçu qui ne montre « rien de neuf » est le signe le plus
 * probable d'un mauvais jeton dans l'URL, pas d'une absence de brouillon.
 *
 * Ne lit l'URL qu'au chargement : un visiteur charge une URL d'aperçu une
 * fois, ce n'est pas un cas qui a besoin de plus.
 */
export function useSiteContent(): UseSiteContentResult {
  const { previewToken, cached, applied } = useBrowserValue(readBrowserState, SERVER_STATE);
  const [live, setLive] = useState<SiteContent | null>(null);

  useEffect(() => {
    // Pas avant d'avoir lu le jeton d'aperçu : l'appel partirait vers le
    // publié juste avant le brouillon. Pas de jeton public (dépôt tout juste
    // cloné, .env absent) : rien à rafraîchir, le cache ou l'instantané suffit.
    if (!applied || !hasPublicToken()) return;
    let cancelled = false;
    fetchPublicJson<SiteContent>("content", previewToken)
      .then((fresh) => {
        if (cancelled) return;
        setLive(fresh);
        // Mode publié seulement : un aperçu ne doit jamais écraser le
        // contenu publié mémorisé dans le cache (voir lib/content-cache.ts).
        if (!previewToken) writeCachedContent(fresh);
      })
      .catch(() => {
        // Contenu inchangé : cache, snapshot de build ou dernier fetch réussi.
      });
    return () => {
      cancelled = true;
    };
  }, [applied, previewToken]);

  const content = useMemo(() => live ?? (cached ? withMissingSections(cached, snapshotContent) : snapshotContent), [live, cached]);
  const source: ContentSource = live ? "live" : cached ? "cache" : "snapshot";
  return { content, isPreview: previewToken !== null, isFresh: live !== null, previewToken, source, browserStateApplied: applied };
}
