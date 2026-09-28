// src/pages/Blog.tsx
import { Link } from "react-router";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { SiteHead } from "../components/SiteHead";
import { useSection, useSiteMeta } from "../hooks/site-content-context";
import { formatDate } from "../lib/format";
import type { NavSection } from "../types/standard-sections";
import { ui } from "../ui-strings";

/**
 * Liste des articles publiés (GET /content, sans corps) ; non paginée, tous
 * les articles du site. Titre = libellé de l'entrée du menu (nav.blogLabel) :
 * renommer « Blog » dans Lea CRM renomme aussi la page.
 */
export function Blog() {
  const { site, articles } = useSiteMeta();
  const { blogLabel } = useSection<NavSection>("nav");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <SiteHead title={blogLabel ?? ""} settings={site.settings} />
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{blogLabel}</h1>
      {articles.length === 0 && <p className="mt-6 text-slate-600">{ui.blog.empty}</p>}
      <ul className="mt-8 grid gap-8">
        {articles.map((article) => {
          const date = formatDate(article.publishedAt);
          return (
            <li key={article.slug}>
              <Link to={`/blog/${article.slug}`} className="group block">
                <ResponsiveImage
                  image={article.cover}
                  sizes="(min-width: 768px) 768px, 100vw"
                  loading="lazy"
                  className="mb-4 aspect-[16/9] w-full rounded-lg object-cover"
                />
                {date && <p className="text-sm text-slate-500">{date}</p>}
                <h2 className="mt-1 text-xl font-semibold text-slate-900 group-hover:underline">{article.title}</h2>
                {article.excerpt && <p className="mt-2 text-slate-600">{article.excerpt}</p>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
