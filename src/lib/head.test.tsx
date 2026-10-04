import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { SiteHead } from "../components/SiteHead";
import { StructuredData } from "../components/StructuredData";
import { SiteContentContext } from "../hooks/site-content-context";
import type { UseSiteContentResult } from "../hooks/useSiteContent";
import type { SiteContent, SiteSettings } from "../types/site-content";
import { createHeadCollector, HeadCollectorContext, metaTag, renderHeadTags, useHead, type HeadTag } from "./head";

function Probe({ tags }: { tags: HeadTag[] }) {
  useHead(tags);
  return null;
}

/** Balises de tête collectées pendant le rendu serveur de `element`, écrites comme dans le HTML prérendu. */
function collectHead(element: ReactNode): string {
  const head = createHeadCollector();
  renderToString(<HeadCollectorContext.Provider value={head.collect}>{element}</HeadCollectorContext.Provider>);
  return renderHeadTags(head.tags());
}

describe("useHead au rendu serveur", () => {
  it("enregistre les balises déclarées pendant renderToString", () => {
    const tags: HeadTag[] = [
      { kind: "title", text: "Accueil | Plomberie Martin" },
      metaTag("name", "description", "Dépannage et installation, Paris 11e."),
      metaTag("property", "og:title", "Accueil | Plomberie Martin"),
      { kind: "canonical", href: "https://plomberie-martin.fr/" },
      { kind: "json-ld", id: "ld-local-business", json: '{"@type":"LocalBusiness"}' },
    ];
    expect(collectHead(<Probe tags={tags} />)).toBe(
      [
        "<title>Accueil | Plomberie Martin</title>",
        '<meta name="description" content="Dépannage et installation, Paris 11e.">',
        '<meta property="og:title" content="Accueil | Plomberie Martin">',
        '<link rel="canonical" href="https://plomberie-martin.fr/">',
        '<script type="application/ld+json" id="ld-local-business">{"@type":"LocalBusiness"}</script>',
      ].join("\n"),
    );
  });

  it("garde la dernière déclaration d'une même balise, à la place de la première", () => {
    const first: HeadTag[] = [{ kind: "title", text: "Site" }, metaTag("name", "description", "Première")];
    const second: HeadTag[] = [{ kind: "title", text: "Blog | Plomberie Martin" }];
    expect(
      collectHead(
        <>
          <Probe tags={first} />
          <Probe tags={second} />
        </>,
      ),
    ).toBe(['<title>Blog | Plomberie Martin</title>', '<meta name="description" content="Première">'].join("\n"));
  });

  it("n'écrit pas une balise sans valeur", () => {
    const tags: HeadTag[] = [
      metaTag("property", "og:image", undefined),
      { kind: "canonical", href: undefined },
      { kind: "json-ld", id: "ld-local-business", json: undefined },
    ];
    expect(collectHead(<Probe tags={tags} />)).toBe("");
  });

  it("échappe les valeurs, et un JSON-LD ne peut pas fermer sa balise", () => {
    const tags: HeadTag[] = [
      { kind: "title", text: "Martin & Fils <Paris>" },
      metaTag("name", "description", 'Le "vrai" dépannage'),
      { kind: "json-ld", id: "ld-local-business", json: '{"name":"</script><script>alert(1)</script>"}' },
    ];
    expect(collectHead(<Probe tags={tags} />)).toBe(
      [
        "<title>Martin &amp; Fils &lt;Paris&gt;</title>",
        '<meta name="description" content="Le &quot;vrai&quot; dépannage">',
        '<script type="application/ld+json" id="ld-local-business">{"name":"\\u003c/script>\\u003cscript>alert(1)\\u003c/script>"}</script>',
      ].join("\n"),
    );
  });

  it("ne collecte rien sans collecteur (navigateur) et ne rend rien", () => {
    const tags: HeadTag[] = [{ kind: "title", text: "Accueil" }];
    expect(renderToString(<Probe tags={tags} />)).toBe("");
  });
});

const SETTINGS: SiteSettings = {
  seo: {
    titleSuffix: " | Plomberie Martin",
    defaultDescription: "Dépannage et installation, Paris 11e.",
    ogImage: { url: "https://cdn.example.com/partage.jpg", alt: null, width: 1200, height: 630 },
  },
};

const CONTENT: SiteContent = {
  site: { name: "Plomberie Martin", domains: ["plomberie-martin.fr"], settings: SETTINGS, publishedAt: "2026-09-25T11:12:30.331Z" },
  sections: { nav: { brandName: "Plomberie Martin" }, footer: { phone: "01 23 45 67 89" }, legal: {} },
  articles: [],
};

const CONTEXT: UseSiteContentResult = {
  content: CONTENT,
  isPreview: false,
  isFresh: false,
  previewToken: null,
  source: "snapshot",
  browserStateApplied: false,
};

const BLOG_PATH = "/blog/";
const BLOG_TITLE = "Blog";
const NOT_FOUND_TITLE = "Page introuvable";

/** Tête prérendue d'une page qui rend `page` à l'adresse `path`, avec le JSON-LD du site comme Layout. */
function prerenderedHead(path: string, page: ReactNode, context: UseSiteContentResult = CONTEXT): string {
  return collectHead(
    <StaticRouter location={path}>
      <SiteContentContext.Provider value={context}>
        {page}
        <StructuredData />
      </SiteContentContext.Provider>
    </StaticRouter>,
  );
}

describe("SiteHead et StructuredData au rendu serveur", () => {
  it("déclarent titre, description, Open Graph, canonique et JSON-LD au collecteur", () => {
    const head = prerenderedHead(BLOG_PATH, <SiteHead title={BLOG_TITLE} settings={SETTINGS} />);
    expect(head.split("\n")).toStrictEqual([
      "<title>Blog | Plomberie Martin</title>",
      '<meta name="description" content="Dépannage et installation, Paris 11e.">',
      '<meta property="og:title" content="Blog | Plomberie Martin">',
      '<meta property="og:description" content="Dépannage et installation, Paris 11e.">',
      '<meta property="og:type" content="website">',
      '<meta property="og:locale" content="fr_FR">',
      '<meta property="og:url" content="https://plomberie-martin.fr/blog">',
      '<meta property="og:image" content="https://cdn.example.com/partage.jpg">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      '<meta name="twitter:card" content="summary_large_image">',
      '<link rel="canonical" href="https://plomberie-martin.fr/blog">',
      '<script type="application/ld+json" id="ld-local-business">' +
        '{"@context":"https://schema.org","@type":"LocalBusiness","name":"Plomberie Martin","url":"https://plomberie-martin.fr",' +
        '"telephone":"01 23 45 67 89","image":"https://cdn.example.com/partage.jpg"}</script>',
    ]);
  });

  it("sans domaine : ni canonique ni og:url au prérendu (og:url est l'adresse courante, posée dans le navigateur)", () => {
    const withoutDomain = { ...CONTEXT, content: { ...CONTENT, site: { ...CONTENT.site, domains: [] } } };
    const head = prerenderedHead(BLOG_PATH, <SiteHead title={BLOG_TITLE} settings={SETTINGS} />, withoutDomain);
    expect(head).toContain("<title>Blog | Plomberie Martin</title>");
    expect(head).not.toContain("canonical");
    expect(head).not.toContain("og:url");
  });

  it("noindex : robots noindex et aucune canonique ni og:url (page 404)", () => {
    const head = prerenderedHead("/404", <SiteHead title={NOT_FOUND_TITLE} settings={SETTINGS} noindex />);
    expect(head).toContain('<meta name="robots" content="noindex">');
    expect(head).not.toContain("canonical");
    expect(head).not.toContain("og:url");
  });
});

describe("SiteHead : suffixe des titres (settings.seo.titleSuffix)", () => {
  const SITE_NAME = "Menuiserie Durand";
  const NAMED: UseSiteContentResult = { ...CONTEXT, content: { ...CONTENT, site: { ...CONTENT.site, name: SITE_NAME } } };
  /** Titre et og:title prérendus d'une page de titre `title` (l'accueil passe le nom du site), site « Menuiserie Durand ». */
  const titles = (title: string, settings: SiteSettings) =>
    prerenderedHead(title === SITE_NAME ? "/" : BLOG_PATH, <SiteHead title={title} settings={settings} />, NAMED)
      .split("\n")
      .filter((line) => line.startsWith("<title>") || line.includes('property="og:title"'));
  const both = (text: string) => [`<title>${text}</title>`, `<meta property="og:title" content="${text}">`];

  it("absent, page Blog : « Blog | <nom du site> », jamais le suffixe d'un autre site", () => {
    expect(titles(BLOG_TITLE, { seo: { defaultDescription: "Menuiserie sur mesure." } })).toStrictEqual(both("Blog | Menuiserie Durand"));
    expect(titles(BLOG_TITLE, {})).toStrictEqual(both("Blog | Menuiserie Durand"));
  });

  it("absent, accueil (titre = nom du site) : le nom seul, jamais « Nom | Nom »", () => {
    expect(titles(SITE_NAME, {})).toStrictEqual(both("Menuiserie Durand"));
  });

  it("présent : tel quel, accueil compris", () => {
    expect(titles(BLOG_TITLE, { seo: { titleSuffix: " | Menuiserie à Lyon" } })).toStrictEqual(both("Blog | Menuiserie à Lyon"));
    expect(titles(SITE_NAME, { seo: { titleSuffix: " | Menuiserie à Lyon" } })).toStrictEqual(both("Menuiserie Durand | Menuiserie à Lyon"));
  });

  it("chaîne vide : aucun suffixe, la valeur explicite est respectée", () => {
    expect(titles(BLOG_TITLE, { seo: { titleSuffix: "" } })).toStrictEqual(both("Blog"));
    expect(titles(SITE_NAME, { seo: { titleSuffix: "" } })).toStrictEqual(both("Menuiserie Durand"));
  });
});
