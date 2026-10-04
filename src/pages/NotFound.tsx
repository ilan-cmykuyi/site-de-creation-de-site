// src/pages/NotFound.tsx
//
// Page 404 : toute adresse que les routes de src/App.tsx ne connaissent pas.
// Prérendue au build dans dist/404.html, que l'hébergeur sert (code 404)
// pour toute adresse sans fichier. Ce HTML-là n'est jamais hydraté
// (src/main.tsx) : dans le navigateur, le routeur peut afficher une vraie
// page à cette adresse, par exemple un article publié après le dernier build.
import { Link } from "react-router";
import { SiteHead } from "../components/SiteHead";
import { useSection, useSiteMeta } from "../hooks/site-content-context";
import { BODY, PAGE_TITLE, WRAP } from "../lib/layout";
import type { NavSection } from "../types/standard-sections";
import { ui } from "../ui-strings";

export function NotFound() {
  const { site } = useSiteMeta();
  const { homeLabel } = useSection<NavSection>("nav");

  return (
    <div className={`${WRAP} pt-8 pb-24 md:pt-12 md:pb-36`}>
      <SiteHead title={ui.notFound.title} settings={site.settings} noindex />
      <h1 className={`border-t border-rule pt-8 md:pt-12 ${PAGE_TITLE}`}>{ui.notFound.title}</h1>
      <p className={`mt-8 text-muted md:mt-12 ${BODY} md:text-[18px]`}>{ui.notFound.text}</p>
      <Link to="/" className="button mt-10">
        {ui.notFound.back(homeLabel || site.name)}
      </Link>
    </div>
  );
}
