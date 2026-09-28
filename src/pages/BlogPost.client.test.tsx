// @vitest-environment happy-dom
//
// BlogPost dans le navigateur, d'un état à l'autre (chargement, prêt,
// erreur). Chaque montage de <SiteHead> appelle injectTrackingIfConsented,
// donc envoie une page vue (gtm.js, ou gtag config) quand le visiteur a
// accepté le suivi : un changement d'état ne doit jamais le remonter.
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrerenderedArticleContext, SiteContentContext } from "../hooks/site-content-context";
import type { UseSiteContentResult } from "../hooks/useSiteContent";
import { ApiError } from "../lib/api";
import { injectTrackingIfConsented } from "../lib/tracking";
import type { ArticleSummary, PrerenderedArticle, SiteContent } from "../types/site-content";
import { ui } from "../ui-strings";
import { BlogPost } from "./BlogPost";

// Réponses successives de GET /articles/:slug, fixées par chaque test, et
// appels reçus (chemin, jeton d'aperçu).
const api = vi.hoisted(() => ({ responses: [] as Promise<unknown>[], calls: [] as { path: string; previewToken: string | null }[] }));
vi.mock("../lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/api")>()),
  hasPublicToken: () => true,
  fetchPublicJson: (path: string, previewToken: string | null) => {
    api.calls.push({ path, previewToken });
    return api.responses.shift() ?? new Promise(() => {});
  },
}));
vi.mock("../lib/tracking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/tracking")>()),
  injectTrackingIfConsented: vi.fn(),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SUMMARY: ArticleSummary = {
  slug: "fuite-sous-evier",
  title: "Fuite sous l'évier",
  excerpt: "Les bons réflexes avant l'arrivée du plombier.",
  cover: null,
  publishedAt: "2026-09-21T08:00:00.000Z",
  seoTitle: null,
  seoDescription: null,
};
const ARTICLE: PrerenderedArticle = { ...SUMMARY, bodyHtml: "<p>Coupez l'arrivée d'eau.</p>" };
const PATH = `/blog/${SUMMARY.slug}`;

const CONTENT: SiteContent = {
  site: { name: "Plomberie Martin", domains: ["plomberie-martin.fr"], settings: { gtmId: "GTM-TEST000" }, publishedAt: "2026-09-25T11:12:30.331Z" },
  sections: { nav: { blogLabel: "Blog" } },
  articles: [SUMMARY],
};
// Même contenu (mêmes réglages) d'un rendu à l'autre : seul l'état de la page change.
const CONTEXT: UseSiteContentResult = { content: CONTENT, isPreview: false, isFresh: true, previewToken: null, source: "live", browserStateApplied: true };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

let root: Root | null = null;
let container: HTMLElement;

function render(context: UseSiteContentResult, article: PrerenderedArticle | null) {
  root!.render(
    <MemoryRouter initialEntries={[PATH]}>
      <SiteContentContext.Provider value={context}>
        <PrerenderedArticleContext.Provider value={article}>
          <Routes>
            <Route path="/blog/:slug" element={<BlogPost />} />
          </Routes>
        </PrerenderedArticleContext.Provider>
      </SiteContentContext.Provider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(injectTrackingIfConsented).mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = null;
  container.remove();
  api.responses = [];
  api.calls = [];
});

describe("BlogPost dans le navigateur : une seule page vue par article", () => {
  it("chargement, puis prêt, puis erreur, dans le même rendu : SiteHead monté une seule fois", async () => {
    const published = deferred<PrerenderedArticle>();
    const preview = deferred<PrerenderedArticle>();
    api.responses = [published.promise, preview.promise];

    await act(async () => render(CONTEXT, null));
    expect(container.textContent).toContain(ui.blog.loading);

    await act(async () => published.resolve(ARTICLE));
    expect(container.querySelector("article h1")?.textContent).toBe(ARTICLE.title);

    // Jeton d'aperçu lu après coup (nouvelle requête), faux : 404.
    await act(async () => render({ ...CONTEXT, isPreview: true, previewToken: "jeton-apercu-faux" }, null));
    await act(async () => preview.reject(new ApiError(404)));
    expect(container.textContent).toContain(ui.blog.unavailable);

    expect(injectTrackingIfConsented).toHaveBeenCalledTimes(1);
  });

  it("article embarqué, prêt puis erreur (dépublié depuis le build) : SiteHead monté une seule fois", async () => {
    const response = deferred<PrerenderedArticle>();
    api.responses = [response.promise];

    await act(async () => render(CONTEXT, ARTICLE));
    expect(container.querySelector("article h1")?.textContent).toBe(ARTICLE.title);

    await act(async () => response.reject(new ApiError(404)));
    expect(container.textContent).toContain(ui.blog.unavailable);

    expect(injectTrackingIfConsented).toHaveBeenCalledTimes(1);
  });

  it("chargement puis erreur (API injoignable) : SiteHead monté une seule fois", async () => {
    const response = deferred<PrerenderedArticle>();
    api.responses = [response.promise];

    await act(async () => render(CONTEXT, null));
    await act(async () => response.reject(new TypeError("Failed to fetch")));
    expect(container.textContent).toContain(ui.blog.unavailable);

    expect(injectTrackingIfConsented).toHaveBeenCalledTimes(1);
  });
});

describe("BlogPost dans le navigateur : l'article attend la lecture du jeton d'aperçu", () => {
  it("aucun appel à l'API tant que browserStateApplied est faux, puis le brouillon seul", async () => {
    const hydrating: UseSiteContentResult = { ...CONTEXT, isFresh: false, source: "snapshot", browserStateApplied: false };
    await act(async () => render(hydrating, ARTICLE));
    expect(api.calls).toStrictEqual([]);
    expect(container.querySelector("article h1")?.textContent).toBe(ARTICLE.title);

    await act(async () => render({ ...hydrating, isPreview: true, previewToken: "jeton-apercu", browserStateApplied: true }, ARTICLE));
    expect(api.calls).toStrictEqual([{ path: `articles/${SUMMARY.slug}`, previewToken: "jeton-apercu" }]);
  });
});
