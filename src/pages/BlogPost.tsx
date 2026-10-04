// src/pages/BlogPost.tsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { SiteHead } from "../components/SiteHead";
import { usePrerenderedArticle, useSection, useSiteMeta } from "../hooks/site-content-context";
import { ApiError, fetchPublicJson, hasPublicToken } from "../lib/api";
import { articleHead, articleView, type ArticleFetch } from "../lib/article-view";
import { formatDate } from "../lib/format";
import { BODY, WRAP } from "../lib/layout";
import type { Article } from "../types/site-content";
import type { NavSection } from "../types/standard-sections";
import { ui } from "../ui-strings";

/**
 * Un article. Sur sa page prérendue, il part de l'article embarqué dans la
 * page (corps compris, lib/prerendered-article.ts) : la page est complète dès
 * le HTML, et le premier rendu du navigateur est celui du serveur. Puis
 * GET /articles/:slug, comme avant : la réponse le remplace ; si l'API est
 * injoignable (panne, CORS refusé), il reste ; si elle répond 404 (article
 * dépublié depuis le build), un message le remplace. Sans article embarqué
 * (arrivée par un lien du site, article publié après le dernier build, corps
 * manquant au build), la page dépend de cet appel : chargement, puis
 * l'article ou un message clair plutôt qu'une page vide. Chaque branche a ses
 * balises de tête (articleHead) ; voir lib/article-view.ts.
 */
export function BlogPost() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { site, articles, previewToken, browserStateApplied } = useSiteMeta();
  const { blogLabel } = useSection<NavSection>("nav");
  const prerendered = usePrerenderedArticle(slug);
  const [fetched, setFetched] = useState<ArticleFetch | null>(null);

  useEffect(() => {
    // Pas avant la lecture du jeton d'aperçu (browserStateApplied) : l'appel
    // partirait vers l'article publié juste avant le brouillon.
    if (!browserStateApplied || !hasPublicToken()) return;
    let cancelled = false;
    fetchPublicJson<Article>(`articles/${encodeURIComponent(slug)}`, previewToken)
      .then((article) => {
        if (!cancelled) setFetched({ slug, result: { status: "ready", article } });
      })
      .catch((err: unknown) => {
        const notFound = err instanceof ApiError && err.status === 404;
        if (!cancelled) setFetched({ slug, result: { status: notFound ? "not_found" : "failed" } });
      });
    return () => {
      cancelled = true;
    };
  }, [slug, previewToken, browserStateApplied]);

  const state = articleView(slug, fetched, prerendered, hasPublicToken());
  const summary = articles.find((article) => article.slug === slug) ?? null;
  // Rendu une seule fois, en tête de chaque branche : SiteHead reste le même
  // composant d'un état à l'autre (chargement, prêt, erreur). Placé dans
  // l'élément de la branche, il serait démonté puis remonté à chaque
  // changement d'état, et chaque montage envoie une page vue
  // (injectTrackingIfConsented). Il ne rend rien : HTML inchangé.
  const head = <SiteHead {...articleHead(state, summary)} settings={site.settings} />;

  if (state.status === "loading") {
    return (
      <>
        {head}
        <div className={`${WRAP} pt-8 pb-24 md:pt-12 md:pb-36`}>
          <p className={`border-t border-rule pt-8 text-muted ${BODY}`}>{ui.blog.loading}</p>
        </div>
      </>
    );
  }
  if (state.status === "error") {
    return (
      <>
        {head}
        <div className={`${WRAP} pt-8 pb-24 md:pt-12 md:pb-36`}>
          <p className={`border-t border-rule pt-8 text-muted ${BODY} md:text-[18px]`}>{ui.blog.unavailable}</p>
          <Link to="/blog" className="pill mt-8">
            {ui.blog.back(blogLabel ?? "")}
          </Link>
        </div>
      </>
    );
  }

  const { article } = state;
  const date = formatDate(article.publishedAt);
  return (
    <>
      {head}
      <article className={`${WRAP} pt-8 pb-24 md:pt-12 md:pb-36`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-6">
          <Link to="/blog" className="pill">
            {ui.blog.back(blogLabel ?? "")}
          </Link>
          {date && <p className="caps text-muted">{date}</p>}
        </div>
        <h1 className="mt-10 max-w-[22ch] text-[38px] leading-[1.04] font-medium tracking-[-0.03em] text-balance md:mt-16 md:text-[60px] lg:text-[80px]">
          {article.title}
        </h1>
        <ResponsiveImage
          image={article.cover}
          sizes="(min-width: 1680px) 1616px, 100vw"
          className="mt-10 aspect-[16/9] w-full rounded-[20px] object-cover md:mt-16"
        />
        {/*
          bodyHtml est assaini côté serveur (lib/sites/sanitize.ts du CRM, liste
          blanche de balises) à CHAQUE enregistrement dans Lea CRM, et celui de
          l'article embarqué dans la page vient de la même API (lu au build,
          écrit dans la page par le prérendu) : c'est la seule raison pour
          laquelle dangerouslySetInnerHTML est acceptable ici. Ne jamais faire
          de même avec un HTML d'une autre provenance (paramètre d'URL, autre
          API, saisie locale) : ce serait une faille XSS.
        */}
        <div className="mt-10 grid md:mt-16 lg:grid-cols-12 lg:gap-x-8">
          <div className="prose prose-site max-w-[68ch] lg:col-span-7 lg:col-start-6" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} />
        </div>
      </article>
    </>
  );
}
