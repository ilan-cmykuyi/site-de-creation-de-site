// Corps des articles publiés, écrits au pré-build par scripts/fetch-content.mjs
// dans src/content.articles.snapshot.json (commité, comme l'instantané du
// contenu). Seul src/entry-server.tsx importe ce fichier : les corps servent
// au prérendu et voyagent dans la page de leur article, jamais dans le
// JavaScript de toutes les pages (README, « Prérendu »). Fonctions pures,
// testées par scripts/lib/article-bodies.test.mjs.
import { mapWithConcurrency } from "./concurrency.mjs";

/** Appels simultanés au plus vers GET /articles/:slug pendant le pré-build. */
export const ARTICLE_BODY_CONCURRENCY = 4;

/**
 * Corps écrits au build précédent (texte de src/content.articles.snapshot.json) :
 * les entrées `{ slug, bodyHtml }` (deux chaînes), les autres écartées ; []
 * si le texte n'est pas un tableau JSON.
 */
export function parseArticleBodies(text) {
  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => typeof entry?.slug === "string" && typeof entry?.bodyHtml === "string")
    .map(({ slug, bodyHtml }) => ({ slug, bodyHtml }));
}

/**
 * Corps de chaque article de `articles` (résumés de GET /content), dans leur
 * ordre : `fetchBody(slug)` renvoie le corps publié (GET /articles/:slug) ou
 * lève, `ARTICLE_BODY_CONCURRENCY` appels à la fois au plus. Comme pour
 * l'instantané, un échec garde la version précédente : un article en échec
 * reprend son corps de `previous` (build précédent) s'il en avait un, sinon
 * reste sans corps (sa page est prérendue avec son titre et sa description,
 * le corps attend l'API dans le navigateur). Le corps d'un article qui n'est
 * plus dans la liste n'est jamais repris. `failures` : un élément par article
 * en échec, pour le journal du build.
 */
export async function collectArticleBodies(articles, fetchBody, previous) {
  const outcomes = await mapWithConcurrency(articles, ARTICLE_BODY_CONCURRENCY, async ({ slug }) => {
    try {
      return { slug, ok: true, bodyHtml: await fetchBody(slug) };
    } catch (error) {
      return { slug, ok: false, error };
    }
  });
  const bodies = [];
  const failures = [];
  for (const { slug, ok, bodyHtml, error } of outcomes) {
    if (ok) {
      bodies.push({ slug, bodyHtml });
      continue;
    }
    const kept = previous.find((body) => body.slug === slug);
    if (kept) bodies.push({ slug, bodyHtml: kept.bodyHtml });
    failures.push({ slug, error, reused: kept !== undefined });
  }
  return { bodies, failures };
}
