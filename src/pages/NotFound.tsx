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
import type { NavSection } from "../types/standard-sections";
import { ui } from "../ui-strings";

export function NotFound() {
  const { site } = useSiteMeta();
  const { homeLabel } = useSection<NavSection>("nav");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <SiteHead title={ui.notFound.title} settings={site.settings} noindex />
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{ui.notFound.title}</h1>
      <p className="mt-6 text-slate-600">{ui.notFound.text}</p>
      <Link to="/" className="mt-6 inline-block text-blue-700 hover:underline">
        {ui.notFound.back(homeLabel || site.name)}
      </Link>
    </div>
  );
}
