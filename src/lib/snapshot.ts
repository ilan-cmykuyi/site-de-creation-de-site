// src/lib/snapshot.ts
//
// Contenu publié figé au dernier build (src/content.snapshot.json, écrit par
// scripts/fetch-content.mjs) : état de départ de tout rendu (prérendu,
// hydratation). Des articles, seulement les résumés : leurs corps sont dans
// un autre fichier, réservé au rendu serveur (src/entry-server.tsx), et
// chaque page d'article porte le sien (lib/prerendered-article.ts). Ce
// module est dans le JavaScript de chaque page : il n'importe jamais ce
// fichier des corps (règle ESLint no-restricted-imports, vérifiée par
// scripts/lib/article-bodies.test.mjs).
import snapshot from "../content.snapshot.json";
import type { SiteContent } from "../types/site-content";

// Typé par annotation, pas par `as` : si la forme écrite par
// scripts/fetch-content.mjs s'éloignait de SiteContent, tsc le dirait.
export const snapshotContent: SiteContent = snapshot;
