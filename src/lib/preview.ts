// src/lib/preview.ts
//
// Jeton d'aperçu (?preview=<jeton>) : il bascule GET /content et
// GET /articles/:slug sur le contenu en brouillon. C'est un secret : il ne
// doit pas rester dans l'URL, sinon il part dans les rapports GA4/GTM (page
// vue avec sa query string), dans les journaux du CDN et dans l'historique du
// navigateur. Dès qu'il est lu, il est mis dans sessionStorage (portée à
// l'onglet, disparaît à sa fermeture) et retiré de l'adresse ; les lectures
// suivantes (navigation interne, rechargement de l'onglet) le reprennent
// depuis sessionStorage. Jamais dans localStorage (il survivrait à la
// fermeture du navigateur sur un poste partagé) ni dans un cookie (il
// partirait à chaque requête vers l'hébergeur du site).
const STORAGE_KEY = "previewToken";

/**
 * Jeton d'aperçu courant, ou null hors aperçu. Un `?preview=` vide vaut
 * « pas de jeton » : il est retiré de l'URL sans être mémorisé.
 */
export function readPreviewToken(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("preview");
  if (fromUrl === null) return readStored();

  params.delete("preview");
  const search = params.toString();
  // history.state est conservé : React Router y range son index de navigation.
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`,
  );
  if (!fromUrl) return null;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, fromUrl);
  } catch {
    // Stockage indisponible (navigation privée stricte) : l'aperçu vaut pour
    // cette page seulement, sans autre conséquence.
  }
  return fromUrl;
}

function readStored(): string | null {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
