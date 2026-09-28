import { renderToString } from "react-dom/server";
import { Route, Routes, StaticRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PrerenderedArticleContext, SiteContentContext } from "../hooks/site-content-context";
import type { UseSiteContentResult } from "../hooks/useSiteContent";
import { createHeadCollector, HeadCollectorContext, renderHeadTags } from "../lib/head";
import type { ArticleSummary, PrerenderedArticle, SiteContent } from "../types/site-content";
import { ui } from "../ui-strings";
import { BlogPost } from "./BlogPost";

// Jeton public du site : sans lui, rien ne sera chargé, et un article sans
// corps embarqué affiche l'erreur au lieu du chargement. Fixé par chaque test,
// quel que soit le .env du poste.
const api = vi.hoisted(() => ({ hasToken: true }));
vi.mock("../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/api")>()),
  hasPublicToken: () => api.hasToken,
}));

const SUMMARY: ArticleSummary = {
  slug: "fuite-sous-evier",
  title: "Fuite sous l'évier",
  excerpt: "Les bons réflexes avant l'arrivée du plombier.",
  cover: { url: "https://cdn.example.com/fuite.jpg", alt: null, width: 1200, height: 630 },
  publishedAt: "2026-09-21T08:00:00.000Z",
  seoTitle: "Fuite sous l'évier : que faire ?",
  seoDescription: null,
};
const ARTICLE: PrerenderedArticle = { ...SUMMARY, bodyHtml: "<p>Coupez l'arrivée d'eau.</p>" };
const SUFFIX = " | Plomberie Martin";

function siteContext(articles: ArticleSummary[]): UseSiteContentResult {
  const content: SiteContent = {
    site: { name: "Plomberie Martin", domains: ["plomberie-martin.fr"], settings: { seo: { titleSuffix: SUFFIX } }, publishedAt: "2026-09-25T11:12:30.331Z" },
    sections: { nav: { blogLabel: "Blog" } },
    articles,
  };
  return { content, isPreview: false, isFresh: false, previewToken: null, source: "snapshot", browserStateApplied: false };
}

/** HTML et balises de tête prérendus de /blog/<slug> ; `article` = article embarqué dans la page ; `articles` = liste du contenu. */
function prerender(slug: string, { article = null, articles = [SUMMARY] }: { article?: PrerenderedArticle | null; articles?: ArticleSummary[] } = {}) {
  const head = createHeadCollector();
  const location = `/blog/${slug}`;
  const html = renderToString(
    <HeadCollectorContext.Provider value={head.collect}>
      <StaticRouter location={location}>
        <SiteContentContext.Provider value={siteContext(articles)}>
          <PrerenderedArticleContext.Provider value={article}>
            <Routes>
              <Route path="/blog/:slug" element={<BlogPost />} />
            </Routes>
          </PrerenderedArticleContext.Provider>
        </SiteContentContext.Provider>
      </StaticRouter>
    </HeadCollectorContext.Provider>,
  );
  return { html, head: renderHeadTags(head.tags()) };
}

/** Un texte tel que React l'écrit dans le HTML. */
function htmlText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

const CANONICAL = '<link rel="canonical" href="https://plomberie-martin.fr/blog/fuite-sous-evier">';

describe("BlogPost au prérendu : balises de tête de chaque branche", () => {
  afterEach(() => {
    api.hasToken = true;
  });

  it("article embarqué dans la page : l'article complet et ses balises", () => {
    const { html, head } = prerender(SUMMARY.slug, { article: ARTICLE });
    expect(html).toContain(ARTICLE.bodyHtml);
    expect(head).toContain(`<title>${SUMMARY.seoTitle}${SUFFIX}</title>`);
    expect(head).toContain(CANONICAL);
    expect(head).not.toContain("robots");
  });

  it("chargement d'un article dont le corps a manqué au build : titre, description, image et canonique tirés du résumé", () => {
    const { html, head } = prerender(SUMMARY.slug);
    expect(html).toContain(htmlText(ui.blog.loading));
    expect(head.split("\n")).toEqual(
      expect.arrayContaining([
        `<title>${SUMMARY.seoTitle}${SUFFIX}</title>`,
        `<meta name="description" content="${SUMMARY.excerpt}">`,
        '<meta property="og:image" content="https://cdn.example.com/fuite.jpg">',
        CANONICAL,
      ]),
    );
    expect(head).not.toContain("robots");
  });

  it("chargement d'un article absent de la liste (publié depuis le build) : noindex, sans canonique", () => {
    const { html, head } = prerender("publie-depuis-le-build", { articles: [] });
    expect(html).toContain(htmlText(ui.blog.loading));
    expect(head).toContain(`<title>${ui.blog.loading}${SUFFIX}</title>`);
    expect(head).toContain('<meta name="robots" content="noindex">');
    expect(head).not.toContain("canonical");
  });

  it("erreur (article dépublié, introuvable ou indisponible) : noindex, ni canonique ni og:url, ni le titre de l'article", () => {
    api.hasToken = false;
    const { html, head } = prerender(SUMMARY.slug);
    expect(html).toContain(htmlText(ui.blog.unavailable));
    expect(head).toContain(`<title>${ui.blog.unavailableTitle}${SUFFIX}</title>`);
    expect(head).toContain('<meta name="robots" content="noindex">');
    expect(head).not.toContain("canonical");
    expect(head).not.toContain("og:url");
    expect(head).not.toContain(SUMMARY.title);
  });

  it("ignore l'article embarqué d'un autre slug (navigation d'article en article) : chargement", () => {
    const { html } = prerender("choisir-son-chauffe-eau", { article: ARTICLE, articles: [SUMMARY] });
    expect(html).toContain(htmlText(ui.blog.loading));
    expect(html).not.toContain(ARTICLE.bodyHtml);
  });
});
