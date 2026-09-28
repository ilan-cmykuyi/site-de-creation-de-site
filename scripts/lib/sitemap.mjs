// Plan du site (sitemap.xml) et robots.txt, écrits dans dist/ au post-build
// par scripts/build-sitemap.mjs à partir du contenu publié. Fonctions pures,
// testées par scripts/lib/sitemap.test.mjs.
//
// Les pages du site sont du code (routes de src/App.tsx) : une page ajoutée
// au site s'ajoute aussi à buildSitemapXml, sans quoi les moteurs de
// recherche ne la trouvent que par les liens.

const XML_ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

function escapeXml(value) {
  return value.replace(/[&<>"']/g, (char) => XML_ENTITIES[char]);
}

/**
 * `https://<premier domaine du site>`, ou null si le site n'a aucun domaine
 * (Lea CRM, Réglages du site > Domaines). Même règle que siteBaseUrl dans
 * src/lib/seo.ts (canonique, données structurées).
 */
export function siteBaseUrl(content) {
  const domain = content.site.domains[0];
  return domain ? `https://${domain}` : null;
}

/**
 * sitemap.xml du site : l'accueil, le blog, chaque article (daté de sa
 * publication) et /mentions-legales si le contenu a la section `legal`.
 */
export function buildSitemapXml(content, baseUrl) {
  const pages = [{ path: "/" }, { path: "/blog" }];
  for (const article of content.articles) pages.push({ path: `/blog/${article.slug}`, lastmod: article.publishedAt });
  if (Object.hasOwn(content.sections, "legal")) pages.push({ path: "/mentions-legales" });

  const urls = pages.map(({ path, lastmod }) => {
    const lines = [`    <loc>${escapeXml(`${baseUrl}${path}`)}</loc>`];
    if (lastmod) lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
    return ["  <url>", ...lines, "  </url>"].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

/** robots.txt : tout est ouvert aux robots, et l'adresse du sitemap leur est donnée. */
export function buildRobotsTxt(baseUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`;
}
