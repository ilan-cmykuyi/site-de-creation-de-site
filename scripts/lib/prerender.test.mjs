import { describe, expect, it } from "vitest";
import { render } from "../../src/entry-server.tsx";
import { readPrerenderedArticle } from "../../src/lib/prerendered-article.ts";
import { injectPage, prerenderPages } from "./prerender.mjs";

const STANDARD_SECTIONS = { hero: {}, testimonials: {}, nav: {}, footer: {}, legal: {} };

/** Contenu publié (forme de src/content.snapshot.json). */
function siteContent({ sections = STANDARD_SECTIONS, articles = [] } = {}) {
  return {
    site: { name: "Plomberie Martin", domains: ["plomberie-martin.fr"], settings: {}, publishedAt: "2026-09-25T11:12:30.331Z" },
    sections,
    articles,
  };
}

/** Résumé d'article de l'instantané (sans corps : il est dans src/content.articles.snapshot.json). */
function article(slug) {
  return { slug, title: slug, excerpt: null, cover: null, publishedAt: null, seoTitle: null, seoDescription: null };
}

describe("prerenderPages", () => {
  it("prérend l'accueil, le blog, chaque article (avec son slug), les mentions légales et la 404, en fichiers .html plats", () => {
    const content = siteContent({ articles: [article("fuite-sous-evier"), article("choisir-son-chauffe-eau")] });
    expect(prerenderPages(content)).toStrictEqual([
      { path: "/", file: "index.html" },
      { path: "/blog", file: "blog.html" },
      { path: "/blog/fuite-sous-evier", file: "blog/fuite-sous-evier.html", slug: "fuite-sous-evier" },
      { path: "/blog/choisir-son-chauffe-eau", file: "blog/choisir-son-chauffe-eau.html", slug: "choisir-son-chauffe-eau" },
      { path: "/mentions-legales", file: "mentions-legales.html" },
      { path: "/404", file: "404.html", notFound: true },
    ]);
  });

  it("n'a pas de /mentions-legales quand le contenu n'a pas de section legal", () => {
    const content = siteContent({ sections: { hero: {}, nav: {}, footer: {} } });
    expect(prerenderPages(content).map((page) => page.path)).toStrictEqual(["/", "/blog", "/404"]);
  });

  it("écarte un slug qui ne serait pas un simple segment d'adresse (jamais d'écriture hors de dist/)", () => {
    const content = siteContent({ articles: [article("../index"), article("a/b"), article(""), article("..\\x"), article("ok-2")] });
    expect(prerenderPages(content).map((page) => page.file)).toStrictEqual([
      "index.html",
      "blog.html",
      "blog/ok-2.html",
      "mentions-legales.html",
      "404.html",
    ]);
  });
});

// Forme de dist/index.html après `vite build` (index.html du dépôt, scripts ajoutés par Vite).
const TEMPLATE = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Site</title>
    <script type="module" crossorigin src="/assets/index-abc.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

describe("injectPage", () => {
  it("écrit le rendu dans #root, les balises collectées à la place du titre du gabarit et les attributs sur <html>", () => {
    const page = injectPage(TEMPLATE, {
      html: "<main><h1>Plomberie Martin</h1></main>",
      head: '<title>Accueil | Plomberie Martin</title>\n<link rel="canonical" href="https://plomberie-martin.fr/">',
      attributes: { "data-prerender": "/", "data-published-at": "2026-09-25T11:12:30.331Z", "data-public-token": "jeton-public" },
    });
    expect(page).toBe(`<!doctype html>
<html lang="fr" data-prerender="/" data-published-at="2026-09-25T11:12:30.331Z" data-public-token="jeton-public">
  <head>
    <meta charset="UTF-8" />
    <title>Accueil | Plomberie Martin</title>
    <link rel="canonical" href="https://plomberie-martin.fr/">
    <script type="module" crossorigin src="/assets/index-abc.js"></script>
  </head>
  <body>
    <div id="root"><main><h1>Plomberie Martin</h1></main></div>
  </body>
</html>
`);
  });

  it("garde le titre du gabarit quand le rendu n'en déclare aucun", () => {
    const page = injectPage(TEMPLATE, { html: "<p>Chargement</p>", head: '<script type="application/ld+json" id="ld">{}</script>', attributes: {} });
    expect(page).toContain('    <title>Site</title>\n    <script type="application/ld+json" id="ld">{}</script>\n');
    expect(page).toContain("<html lang=\"fr\">\n");
  });

  it("recopie le rendu tel quel, motifs de remplacement ($&, $') compris", () => {
    const html = "<p>Tarif : 90 $&amp; plus, $' et $1</p>";
    expect(injectPage(TEMPLATE, { html, head: "", attributes: {} })).toContain(`<div id="root">${html}</div>`);
  });

  it("omet un attribut sans valeur et échappe les autres", () => {
    const page = injectPage(TEMPLATE, { html: "", head: "", attributes: { "data-published-at": null, "data-public-token": 'a"b<c&' } });
    expect(page).toContain('<html lang="fr" data-public-token="a&quot;b&lt;c&amp;">');
  });

  it("refuse un gabarit sans ses repères (déjà prérendu, index.html modifié)", () => {
    const prerendered = injectPage(TEMPLATE, { html: "<p>Accueil</p>", head: "<title>Accueil</title>", attributes: {} });
    expect(() => injectPage(prerendered, { html: "", head: "", attributes: {} })).toThrow(/gabarit/);
  });

  it("écrit l'article d'une page d'article dans un script JSON, juste après #root", () => {
    const page = injectPage(TEMPLATE, { html: "<article>Corps</article>", head: "", attributes: {}, article: { slug: "a", bodyHtml: "<p>Corps</p>" } });
    expect(page).toContain(
      '<div id="root"><article>Corps</article></div><script type="application/json" id="prerender-article">{"slug":"a","bodyHtml":"\\u003cp>Corps\\u003c/p>"}</script>\n',
    );
  });

  it("n'écrit aucun script JSON sans article (autres pages, article sans corps au build)", () => {
    expect(injectPage(TEMPLATE, { html: "", head: "", attributes: {} })).not.toContain("application/json");
    expect(injectPage(TEMPLATE, { html: "", head: "", attributes: {}, article: null })).not.toContain("application/json");
  });

  it("le JSON embarqué ne peut ni fermer sa balise ni ouvrir un commentaire (</script>, <!--)", () => {
    const embedded = { slug: "a", title: "Fuite </script><script>alert(1)</script>", bodyHtml: "<!-- <script> --><p>Corps</p></SCRIPT >" };
    const page = injectPage(TEMPLATE, { html: "", head: "", attributes: {}, article: embedded });
    const json = scriptText(page, "prerender-article");
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toStrictEqual(embedded);
  });
});

/**
 * Texte du <script id="…"> de `page`, tel que le lit le navigateur : l'analyseur
 * HTML ferme la balise au premier « </script », quelle que soit la casse.
 * null si la page n'a pas ce script.
 */
function scriptText(page, id) {
  const open = `<script type="application/json" id="${id}">`;
  const start = page.indexOf(open);
  if (start === -1) return null;
  const text = page.slice(start + open.length);
  const end = text.search(/<\/script/i);
  return end === -1 ? text : text.slice(0, end);
}

/** Document réduit à getElementById, lu dans le HTML de `page` (voir scriptText). */
function documentOf(page) {
  return {
    getElementById: (id) => {
      const text = scriptText(page, id);
      return text === null ? null : { textContent: text };
    },
  };
}

// Un titre et un corps qui essaient de fermer la balise du script JSON ; « $& » reste littéral.
const EMBEDDED_ARTICLE = {
  slug: "fuite-sous-evier",
  title: "Fuite </script> sous l'évier",
  excerpt: "Les bons réflexes.",
  cover: null,
  publishedAt: "2026-09-21T08:00:00.000Z",
  seoTitle: null,
  seoDescription: null,
  bodyHtml: "<h2>Couper l'eau</h2><p>Robinet d'arrêt : 90 $&amp; plus.</p><!-- note --><p>Fin de l'article.</p>",
};
const ARTICLE_PATH = `/blog/${EMBEDDED_ARTICLE.slug}`;

describe("page d'article prérendue puis hydratée", () => {
  it("le premier rendu du navigateur, avec l'article lu dans la page, reproduit le HTML prérendu", () => {
    const server = render(ARTICLE_PATH, { article: EMBEDDED_ARTICLE });
    const page = injectPage(TEMPLATE, { html: server.html, head: server.head, attributes: { "data-prerender": ARTICLE_PATH }, article: EMBEDDED_ARTICLE });
    expect(page).toContain(EMBEDDED_ARTICLE.bodyHtml);

    const fromPage = readPrerenderedArticle(documentOf(page));
    expect(fromPage).toStrictEqual(EMBEDDED_ARTICLE);
    expect(render(ARTICLE_PATH, { article: fromPage }).html).toBe(server.html);
  });

  it("sans article embarqué, le premier rendu n'est pas l'article (chargement ou erreur)", () => {
    expect(render(ARTICLE_PATH, { article: EMBEDDED_ARTICLE }).html).toContain(EMBEDDED_ARTICLE.bodyHtml);
    expect(render(ARTICLE_PATH, { article: null }).html).not.toContain(EMBEDDED_ARTICLE.bodyHtml);
    expect(render(ARTICLE_PATH).html).not.toContain(EMBEDDED_ARTICLE.bodyHtml);
  });
});
