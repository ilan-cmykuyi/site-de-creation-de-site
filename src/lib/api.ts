// src/lib/api.ts
//
// Appels à l'API publique de Lea CRM depuis le navigateur. Soumis à CORS :
// l'origine du site doit figurer dans Site.domains côté CRM (Réglages du
// site > Domaines) et être en https. Depuis localhost vers la production,
// tout appel échoue (voir README, « CORS et développement local ») : le site
// reste alors sur src/content.snapshot.json.
import { siteConfig } from "../../site.config";

export function hasPublicToken(): boolean {
  return siteConfig.publicToken.length > 0;
}

export function publicApiUrl(path: string, previewToken: string | null): string {
  const base = `${siteConfig.apiBase}/${siteConfig.publicToken}/${path}`;
  return previewToken ? `${base}?preview=${encodeURIComponent(previewToken)}` : base;
}

/** Réponse non 2xx de l'API ; `status` distingue un 404 (jeton, aperçu ou article inconnu) d'une panne. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

/** GET JSON ; rejette avec ApiError sur toute réponse non 2xx (404 jeton inconnu ou aperçu invalide compris), avec l'erreur réseau sinon. */
export async function fetchPublicJson<T>(path: string, previewToken: string | null): Promise<T> {
  const res = await fetch(publicApiUrl(path, previewToken), { cache: previewToken ? "no-store" : "default" });
  if (!res.ok) throw new ApiError(res.status);
  return (await res.json()) as T;
}
