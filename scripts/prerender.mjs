#!/usr/bin/env node
// Post-build : écrit dans dist/ une page HTML complète par adresse du site
// (scripts/lib/prerender.mjs pour la liste et l'injection), rendue par
// dist-ssr/entry-server.js (`vite build --ssr src/entry-server.tsx`) à
// partir de l'instantané src/content.snapshot.json. Le gabarit est
// dist/index.html tel que `vite build` vient de l'écrire ; il est remplacé
// par la page d'accueil prérendue.
//
// Chaque page porte sur <html> : data-prerender (l'adresse prérendue, ou 404
// pour la page servie à toute adresse inconnue ; src/main.tsx n'hydrate que
// si elle correspond à l'adresse visitée), data-published-at (date de la
// publication figée dans l'instantané) et data-public-token (jeton public du
// site, déjà présent dans le bundle), que lit le script anti-clignotement
// d'index.html.
//
// La page d'un article porte aussi l'article et son corps (script JSON après
// #root) : le même objet que celui passé au rendu serveur, que src/main.tsx
// relit avant l'hydratation. Les corps viennent de
// src/content.articles.snapshot.json, que seul le bundle du prérendu importe
// (prerenderedArticle) : ils ne sont jamais dans le JavaScript du site.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { injectPage, prerenderPages } from "./lib/prerender.mjs";

// React côté serveur en mode production, comme le bundle qui hydratera ces
// pages. Avant l'import dynamique ci-dessous : React lit NODE_ENV au chargement.
process.env.NODE_ENV ??= "production";

const DIST_URL = new URL("../dist/", import.meta.url);
const SNAPSHOT_URL = new URL("../src/content.snapshot.json", import.meta.url);
const ENTRY_URL = new URL("../dist-ssr/entry-server.js", import.meta.url);

const template = await readFile(new URL("index.html", DIST_URL), "utf8");
const content = JSON.parse(await readFile(SNAPSHOT_URL, "utf8"));
const { render, publicToken, prerenderedArticle } = await import(ENTRY_URL.href);

const pages = prerenderPages(content);
const withoutBody = [];
for (const page of pages) {
  const article = page.slug === undefined ? null : prerenderedArticle(page.slug);
  if (page.slug !== undefined && !article) withoutBody.push(page.slug);
  const { html, head } = render(page.path, { article });
  const attributes = {
    "data-prerender": page.notFound ? "404" : page.path,
    "data-published-at": content.site.publishedAt,
    "data-public-token": publicToken || null,
  };
  const fileUrl = new URL(page.file, DIST_URL);
  await mkdir(dirname(fileURLToPath(fileUrl)), { recursive: true });
  await writeFile(fileUrl, injectPage(template, { html, head, attributes, article }), "utf8");
}
console.log(`[prerender] ${pages.length} page(s) écrite(s) dans ${fileURLToPath(DIST_URL)} : ${pages.map((page) => page.file).join(", ")}.`);
if (withoutBody.length > 0) {
  console.warn(
    `[prerender] article(s) sans corps au build (${withoutBody.join(", ")}) : page prérendue avec son titre et sa description, corps chargé depuis l'API dans le navigateur.`,
  );
}
