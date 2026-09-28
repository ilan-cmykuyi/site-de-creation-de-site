// src/hooks/useConsent.ts
import { useCallback, useState } from "react";
import { useLocation } from "react-router";
import { useSiteMeta } from "./site-content-context";
import { useBrowserValue } from "./useBrowserValue";
import {
  hasTracking,
  injectTrackingIfConsented,
  readConsentChoice,
  storeConsentChoice,
  updateConsentMode,
  type ConsentChoice,
} from "../lib/tracking";

/**
 * Consentement minimal, tout ou rien (mesure d'audience + publicité), mémorisé
 * dans localStorage. `needsDecision` n'est vrai que si le site a au moins un
 * identifiant de suivi dans ses réglages : sans suivi, pas de bannière.
 *
 * Choix inconnu (undefined) au prérendu et au premier rendu du navigateur :
 * aucune bannière dans le HTML prérendu, qui est le même pour tous les
 * visiteurs ; le choix mémorisé est lu juste après (useBrowserValue).
 */
export function useConsent() {
  const { site } = useSiteMeta();
  const { pathname } = useLocation();
  const stored = useBrowserValue<ConsentChoice | null | undefined>(readConsentChoice, undefined);
  // Choix fait sur cette page : vaut même si le stockage est indisponible.
  const [decided, setDecided] = useState<ConsentChoice | null>(null);
  const choice = decided ?? stored;

  const decide = useCallback(
    (next: ConsentChoice) => {
      storeConsentChoice(next);
      updateConsentMode({ analytics: next === "granted", ads: next === "granted" });
      if (next === "granted") injectTrackingIfConsented(site.settings, pathname);
      setDecided(next);
    },
    [site.settings, pathname],
  );

  return {
    choice,
    needsDecision: choice === null && hasTracking(site.settings),
    grant: () => decide("granted"),
    deny: () => decide("denied"),
  };
}
