// src/hooks/useBrowserValue.ts
import { useSyncExternalStore } from "react";

// Valeurs lues une fois, que rien ne demande de suivre pendant la visite : aucun abonnement.
const noSubscription = () => () => {};

/**
 * Valeur que seul le navigateur connaît (adresse, stockage, date du jour),
 * jamais lue pendant le rendu serveur. `serverValue` sert au prérendu ET au
 * premier rendu du navigateur, celui que l'hydratation compare au HTML
 * prérendu (il doit lui être identique) ; `read()` est appelée juste après,
 * et un nouveau rendu suit si sa valeur diffère. Sans hydratation (serveur
 * de dev, page 404), `read()` sert dès le premier rendu.
 *
 * `read` doit renvoyer la même valeur tant que rien ne change : une chaîne,
 * un nombre, ou un objet mémorisé (même référence d'un appel à l'autre).
 */
export function useBrowserValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(noSubscription, read, () => serverValue);
}
