// src/pages/Blog.tsx
import { Link } from "react-router";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { SiteHead } from "../components/SiteHead";
import { useSection, useSiteMeta } from "../hooks/site-content-context";
import { formatDate } from "../lib/format";
import { BODY, PAGE_TITLE, WRAP } from "../lib/layout";
import type { NavSection } from "../types/standard-sections";
import { ui } from "../ui-strings";

/**
 * Liste des articles publiés (GET /content, sans corps) ; non paginée, tous
 * les articles du site. Titre = libellé de l'entrée du menu (nav.blogLabel) :
 * renommer « Blog » dans Lea CRM renomme aussi la page. Une rangée par
 * article, posée sur un filet ; la photo de couverture, si elle existe, à
 * droite sur grand écran.
 */
export function Blog() {
  const { site, articles } = useSiteMeta();
  const { blogLabel } = useSection<NavSection>("nav");

  return (
    <div className={`${WRAP} pt-8 pb-24 md:pt-12 md:pb-36`}>
      <SiteHead title={blogLabel ?? ""} settings={site.settings} />
      <h1 className={`border-t border-rule pt-8 md:pt-12 ${PAGE_TITLE}`}>{blogLabel}</h1>
      {articles.length === 0 && <p className={`mt-10 text-muted md:mt-14 ${BODY} md:text-[18px]`}>{ui.blog.empty}</p>}
      {articles.length > 0 && (
        <ul className="mt-12 border-b border-rule md:mt-20">
          {articles.map((article) => {
            const date = formatDate(article.publishedAt);
            return (
              <li key={article.slug} className="border-t border-rule">
                <Link to={`/blog/${article.slug}`} className="group grid gap-6 py-8 md:grid-cols-12 md:gap-x-8 md:py-10">
                  <div className="md:col-span-7 lg:col-span-8">
                    {date && <p className="caps text-muted">{date}</p>}
                    <h2 className="mt-3 text-[26px] leading-[1.1] font-medium tracking-[-0.02em] text-balance decoration-1 underline-offset-[6px] group-hover:underline md:text-[36px] lg:text-[44px]">
                      {article.title}
                    </h2>
                    {article.excerpt && <p className={`mt-4 max-w-[60ch] text-muted ${BODY}`}>{article.excerpt}</p>}
                  </div>
                  {article.cover && (
                    <div className="overflow-hidden rounded-[20px] md:col-span-5 lg:col-span-4">
                      <ResponsiveImage
                        image={article.cover}
                        sizes="(min-width: 768px) 40vw, 100vw"
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out group-hover:scale-[1.025]"
                      />
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
