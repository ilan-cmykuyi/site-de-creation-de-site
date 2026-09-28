// site.config.ts
//
// URL de l'API publique de Lea CRM et jeton public du site. Vite n'expose au
// code client que les variables d'environnement préfixées VITE_ (le reste est
// retiré du bundle) : c'est pourquoi les deux variables s'appellent
// VITE_SITE_API_BASE / VITE_SITE_PUBLIC_TOKEN, y compris pour
// scripts/fetch-content.mjs (Node, qui lit les mêmes noms pour n'avoir que
// deux variables à poser dans Cloudflare Pages). Voir README, « Déploiement ».
//
// Le jeton public n'est PAS un secret : lecture seule du contenu publié d'un
// site, il se régénère à volonté depuis Lea CRM (Réglages > Jetons d'accès).
// Il n'a pourtant pas de valeur par défaut ici : chaque site a le sien, posé
// dans `.env` (jamais commité) en local et dans les variables de build sur
// Cloudflare Pages. Sans jeton, le site s'affiche avec le contenu de
// src/content.snapshot.json et ne rafraîchit rien.
//
// Ne JAMAIS mettre le jeton d'APERÇU ici : il se donne à la volée dans l'URL
// de la personne qui prévisualise (?preview=...), jamais dans le dépôt.
// Voir src/lib/preview.ts.
export const siteConfig = {
  apiBase: (import.meta.env.VITE_SITE_API_BASE || "https://app.leacrm.com/api/sites/public").replace(/\/+$/, ""),
  publicToken: (import.meta.env.VITE_SITE_PUBLIC_TOKEN || "").trim(),
};
