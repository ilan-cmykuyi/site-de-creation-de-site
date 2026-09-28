#!/usr/bin/env node
// Post-build : écrit dist/sitemap.xml et dist/robots.txt (avec la ligne
// Sitemap) à partir de src/content.snapshot.json, le contenu publié que le
// pré-build vient d'écrire (ou l'instantané commité s'il n'a pas pu). Les
// adresses du sitemap sont absolues : sans domaine dans le contenu (Lea CRM,
// Réglages du site > Domaines), avertissement et rien n'est écrit ;
// dist/robots.txt reste alors la copie de public/robots.txt, sans sitemap.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { buildRobotsTxt, buildSitemapXml, siteBaseUrl } from "./lib/sitemap.mjs";

const SNAPSHOT_URL = new URL("../src/content.snapshot.json", import.meta.url);
const SITEMAP_URL = new URL("../dist/sitemap.xml", import.meta.url);
const ROBOTS_URL = new URL("../dist/robots.txt", import.meta.url);

const content = JSON.parse(await readFile(SNAPSHOT_URL, "utf8"));
const baseUrl = siteBaseUrl(content);

if (!baseUrl) {
  console.warn("[build-sitemap] aucun domaine dans le contenu (Réglages du site > Domaines) : sitemap.xml non écrit, robots.txt reste celui de public/.");
} else {
  await writeFile(SITEMAP_URL, buildSitemapXml(content, baseUrl), "utf8");
  await writeFile(ROBOTS_URL, buildRobotsTxt(baseUrl), "utf8");
  console.log(`[build-sitemap] ${fileURLToPath(SITEMAP_URL)} et robots.txt écrits pour ${baseUrl}.`);
}
