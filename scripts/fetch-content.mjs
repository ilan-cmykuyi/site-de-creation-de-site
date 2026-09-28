#!/usr/bin/env node
// Pré-build : récupère le contenu publié du site et l'écrit dans
// src/content.snapshot.json. Échec (réseau, jeton absent ou inconnu, réponse
// invalide) : on garde le snapshot précédent s'il existe (avertissement, build
// non bloqué) ; sinon on fait échouer le build, puisqu'il n'y aurait rien à
// afficher. Le snapshot est COMMITÉ : Cloudflare Pages part d'un checkout
// propre à chaque build, c'est la seule façon d'avoir un « précédent ».
//
// Tourne dans Node (CI ou poste local), jamais dans un navigateur : les règles
// CORS de l'API publique ne s'appliquent pas ici, seuls les appels du
// navigateur (src/lib/api.ts) y sont soumis. Ce script ne récupère JAMAIS le
// contenu d'aperçu (pas de ?preview=) : le snapshot est toujours la version
// publiée, l'aperçu est un mécanisme entièrement côté navigateur.
//
// GET /content ne renvoie que des résumés d'articles. Le corps de chacun
// (GET /articles/:slug) va dans un second fichier, commité lui aussi,
// src/content.articles.snapshot.json : seul le rendu serveur l'importe
// (src/entry-server.tsx), pour prérendre les pages d'articles complètes ;
// src/content.snapshot.json, dans le JavaScript de chaque page, n'a jamais
// de corps. Mêmes règles de repli : échec général, les deux fichiers
// précédents restent ; échec d'un article, son corps précédent reste
// (scripts/lib/article-bodies.mjs).
import { existsSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { collectArticleBodies, parseArticleBodies } from "./lib/article-bodies.mjs";

const ROOT = new URL("../", import.meta.url);
const OUT_URL = new URL("../src/content.snapshot.json", import.meta.url);
const OUT_PATH = fileURLToPath(OUT_URL);
const BODIES_URL = new URL("../src/content.articles.snapshot.json", import.meta.url);
const BODIES_PATH = fileURLToPath(BODIES_URL);
const DEFAULT_API_BASE = "https://app.leacrm.com/api/sites/public";

// Node ne lit pas .env tout seul (Vite le fait pour le bundle, pas pour ce
// script). Priorité : environnement réel (Cloudflare Pages) > .env.local > .env.
function loadDotEnv() {
  for (const name of [".env.local", ".env"]) {
    const url = new URL(name, ROOT);
    if (!existsSync(url)) continue;
    for (const [key, value] of Object.entries(parseEnv(readFileSync(url, "utf8")))) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function writeJson(url, value) {
  return writeFile(url, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function keepPreviousOrFail(reason) {
  if (existsSync(OUT_URL)) {
    let publishedAt = "date inconnue";
    try {
      publishedAt = JSON.parse(await readFile(OUT_URL, "utf8")).site?.publishedAt ?? publishedAt;
    } catch {
      // Snapshot illisible : on le signale sans en faire plus, le build dira le reste.
    }
    // Le rendu serveur importe le fichier des corps : sans fichier précédent,
    // un fichier vide (les pages d'articles attendront l'API).
    if (!existsSync(BODIES_URL)) await writeJson(BODIES_URL, []);
    console.warn(`[fetch-content] échec (${reason}). Snapshot précédent conservé (publié le ${publishedAt}) : ${OUT_PATH}, corps des articles : ${BODIES_PATH}`);
    return;
  }
  console.error(`[fetch-content] échec (${reason}) et aucun snapshot existant : build arrêté.`);
  process.exit(1);
}

/** Corps des articles du build précédent, [] sans fichier ou s'il est illisible. */
async function previousBodies() {
  return existsSync(BODIES_URL) ? parseArticleBodies(await readFile(BODIES_URL, "utf8")) : [];
}

/**
 * Corps publié de l'article `slug` (GET /articles/:slug) ; lève en cas d'échec.
 * collectArticleBodies en lance quatre à la fois au plus
 * (ARTICLE_BODY_CONCURRENCY), résultats rangés dans l'ordre de la liste.
 */
async function fetchArticleBody(apiBase, token, slug) {
  const res = await fetch(`${apiBase}/${token}/articles/${encodeURIComponent(slug)}`, { signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { bodyHtml } = await res.json();
  if (typeof bodyHtml !== "string") throw new Error("réponse inattendue : pas de bodyHtml");
  return bodyHtml;
}

async function main() {
  loadDotEnv();
  const apiBase = (process.env.VITE_SITE_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, "");
  const token = (process.env.VITE_SITE_PUBLIC_TOKEN || "").trim();
  if (!token) return keepPreviousOrFail("VITE_SITE_PUBLIC_TOKEN absent, voir .env.example");

  try {
    const res = await fetch(`${apiBase}/${token}/content`, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const content = await res.json();
    if (!content || typeof content !== "object" || !content.site || !content.sections || !Array.isArray(content.articles)) {
      throw new Error("réponse inattendue : pas de site/sections/articles");
    }
    const { bodies, failures } = await collectArticleBodies(content.articles, (slug) => fetchArticleBody(apiBase, token, slug), await previousBodies());
    for (const { slug, error, reused } of failures) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(
        reused
          ? `[fetch-content] article « ${slug} » : corps non récupéré (${reason}), celui du build précédent est gardé.`
          : `[fetch-content] article « ${slug} » sans corps (${reason}) : sa page est prérendue avec son titre et sa description, le corps sera chargé depuis l'API.`,
      );
    }
    await writeJson(BODIES_URL, bodies);
    await writeJson(OUT_URL, content);
    console.log(
      `[fetch-content] contenu à jour écrit dans ${OUT_PATH} ` +
        `(site « ${content.site.name} », ${Object.keys(content.sections).length} section(s), ${content.articles.length} article(s)) ; ` +
        `${bodies.length} corps d'article(s) dans ${BODIES_PATH}`,
    );
  } catch (err) {
    await keepPreviousOrFail(err instanceof Error ? err.message : String(err));
  }
}

main();
