// Prérendu des pages du site, écrit dans dist/ au post-build par
// scripts/prerender.mjs. Fonctions pures, testées par
// scripts/lib/prerender.test.mjs.
//
// Les pages du site sont du code (routes de src/App.tsx) : une page ajoutée
// au site s'ajoute aussi à prerenderPages (et au sitemap,
// scripts/lib/sitemap.mjs), sans quoi elle n'existe qu'une fois le
// JavaScript chargé.

// Un slug d'article devient un nom de fichier sous dist/blog/ : un seul
// segment d'adresse, jamais « .. » ni barre oblique (Lea CRM ne produit que
// [a-z0-9-], voir slugify côté CRM ; défense en profondeur).
const SAFE_SLUG_RE = /^[A-Za-z0-9_-]+$/;

/**
 * Adresses à prérendre et fichier de chacune, relatif à dist/ : l'accueil, le
 * blog, chaque article (avec son `slug`, pour lui joindre son corps),
 * /mentions-legales si le contenu a la section `legal`, et la page 404
 * (`notFound`), servie par l'hébergeur pour toute adresse sans fichier.
 * Fichiers .html plats (`blog.html`, pas `blog/index.html`) : Cloudflare
 * Pages sert /blog depuis blog.html et redirige /blog/ vers /blog, l'adresse
 * de la canonique.
 */
export function prerenderPages(content) {
  const pages = [
    { path: "/", file: "index.html" },
    { path: "/blog", file: "blog.html" },
  ];
  for (const { slug } of content.articles) {
    if (SAFE_SLUG_RE.test(slug)) pages.push({ path: `/blog/${slug}`, file: `blog/${slug}.html`, slug });
  }
  if (Object.hasOwn(content.sections, "legal")) pages.push({ path: "/mentions-legales", file: "mentions-legales.html" });
  pages.push({ path: "/404", file: "404.html", notFound: true });
  return pages;
}

const ATTRIBUTE_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

function escapeAttribute(value) {
  return value.replace(/[&<>"]/g, (char) => ATTRIBUTE_ESCAPES[char]);
}

// Identifiant du script JSON de l'article, le même dans
// src/lib/prerendered-article.ts, qui le lit : changer l'un, c'est changer l'autre.
const PRERENDERED_ARTICLE_ID = "prerender-article";

/**
 * <script type="application/json"> qui porte l'article de la page. Dans le
 * JSON, `<` devient `\u003c` (même valeur une fois le JSON lu), comme dans le
 * JSON-LD (src/lib/head.ts) : aucun texte ne peut fermer la balise
 * (« </script> ») ni y ouvrir un commentaire (« <!-- »).
 */
function articleScript(article) {
  const json = JSON.stringify(article).replace(/</g, "\\u003c");
  return `<script type="application/json" id="${PRERENDERED_ARTICLE_ID}">${json}</script>`;
}

// Repères du gabarit (dist/index.html tel que `vite build` l'écrit à partir
// de index.html) : la balise <html>, la ligne du <title> et le #root vide.
const HTML_TAG_RE = /<html([^>]*)>/;
const TITLE_LINE_RE = /^([ \t]*)(<title>[^<]*<\/title>)$/m;
const EMPTY_ROOT = '<div id="root"></div>';

/**
 * Page prérendue : le gabarit avec `html` (rendu serveur de la page) dans
 * <div id="root">, `head` (balises collectées, une par ligne) à la place du
 * <title> du gabarit (après lui si `head` n'a pas de titre), et `attributes`
 * ajoutés à <html> (valeur null ou undefined : attribut omis). `article`
 * (page d'un article, celui passé au rendu serveur) : écrit en JSON juste
 * après #root, pour que le navigateur reparte du même article
 * (src/lib/prerendered-article.ts) ; les corps des articles ne sont jamais
 * dans le JavaScript du site. Échoue si le gabarit n'a plus ses repères, par
 * exemple un dist/index.html déjà prérendu.
 */
export function injectPage(template, { html, head, attributes, article = null }) {
  const title = TITLE_LINE_RE.exec(template);
  if (!HTML_TAG_RE.test(template) || !title || !template.includes(EMPTY_ROOT)) {
    throw new Error(`gabarit inattendu (balise <html>, <title> ou ${EMPTY_ROOT} introuvable) : relancer npm run build`);
  }
  const [, indent, templateTitle] = title;
  const headLines = [...(head.includes("<title>") ? [] : [templateTitle]), ...head.split("\n").filter(Boolean)];
  const htmlAttributes = Object.entries(attributes)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([name, value]) => ` ${name}="${escapeAttribute(String(value))}"`)
    .join("");
  // Remplacements par fonction : un « $& » ou « $' » dans le contenu (texte
  // saisi dans Lea CRM) serait sinon interprété par String.replace.
  return template
    .replace(HTML_TAG_RE, (_tag, existing) => `<html${existing}${htmlAttributes}>`)
    .replace(TITLE_LINE_RE, () => headLines.map((line) => `${indent}${line}`).join("\n"))
    .replace(EMPTY_ROOT, () => `<div id="root">${html}</div>${article ? articleScript(article) : ""}`);
}
