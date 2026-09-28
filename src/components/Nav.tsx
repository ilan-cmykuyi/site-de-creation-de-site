// src/components/Nav.tsx
//
// En-tête et menu, lus dans la section « nav » de site.schema.json. Le
// nombre d'entrées est du code (une route par page fixe, voir App.tsx) ;
// leurs libellés et le nom affiché sont du contenu, édités dans Lea CRM.
// Une entrée sans libellé (site branché avant l'ajout de la section) n'est
// pas rendue plutôt que de laisser un lien vide.
import { Link, NavLink } from "react-router";
import { useSection, useSiteMeta } from "../hooks/site-content-context";
import type { NavSection } from "../types/standard-sections";

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? "font-medium text-slate-900" : "text-slate-600 hover:text-slate-900";
}

export function Nav() {
  const { site } = useSiteMeta();
  const { brandName, homeLabel, blogLabel, contactLabel } = useSection<NavSection>("nav");

  return (
    <header className="border-b border-slate-200">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4">
        <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
          {brandName || site.name}
        </Link>
        <nav className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {homeLabel && (
            <NavLink to="/" end className={navClass}>
              {homeLabel}
            </NavLink>
          )}
          {blogLabel && (
            <NavLink to="/blog" className={navClass}>
              {blogLabel}
            </NavLink>
          )}
          {contactLabel && (
            <a href="/#contact" className="text-slate-600 hover:text-slate-900">
              {contactLabel}
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
