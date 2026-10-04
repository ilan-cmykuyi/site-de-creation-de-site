// src/components/Nav.tsx
//
// Ligne d'annonce, en-tête et menu, lus dans la section « nav » de
// site.schema.json. Le nombre d'entrées est du code (une route par page fixe,
// voir App.tsx, plus deux ancres de l'accueil) ; leurs libellés, le nom
// affiché et l'annonce sont du contenu, édités dans Lea CRM. Une entrée sans
// libellé n'est pas rendue plutôt que de laisser un lien vide.
//
// Sur l'accueil, le nom géant du bandeau tient lieu de logo : l'en-tête n'y
// répète pas le nom. Sur téléphone, les entrées passent dans un menu repliable
// (<details>, utilisable avant même le chargement du JavaScript).
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { useSection, useSiteMeta } from "../hooks/site-content-context";
import { WRAP } from "../lib/layout";
import type { NavSection } from "../types/standard-sections";
import { ui } from "../ui-strings";
import { ArrowIcon } from "./Icons";

function pillClass({ isActive }: { isActive: boolean }) {
  return isActive ? "pill pill-ink" : "pill";
}

const menuLinkClass = "flex items-center justify-between gap-4 py-4 text-[28px] leading-tight font-medium tracking-[-0.02em]";

export function Nav() {
  const { site } = useSiteMeta();
  const { brandName, homeLabel, blogLabel, contactLabel, announcement, realisationsLabel, offresLabel } = useSection<NavSection>("nav");
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const isHome = pathname === "/";

  return (
    <header className="relative">
      {announcement && (
        <p className="border-b border-rule px-4 py-2.5 text-center text-[11px] leading-4 font-medium tracking-[0.12em] text-balance uppercase md:text-[12px]">
          {announcement}
        </p>
      )}
      <div className={`${WRAP} flex min-h-16 items-center justify-between gap-4 py-3`}>
        {isHome ? (
          <span />
        ) : (
          <Link to="/" className="font-display text-[15px] leading-none uppercase md:text-[17px]">
            {brandName || site.name}
          </Link>
        )}
        <nav>
          <ul className="hidden items-center gap-1.5 md:flex">
            {realisationsLabel && (
              <li>
                <a href="/#realisations" className="pill">
                  {realisationsLabel}
                </a>
              </li>
            )}
            {offresLabel && (
              <li>
                <a href="/#offres" className="pill">
                  {offresLabel}
                </a>
              </li>
            )}
            {blogLabel && (
              <li>
                <NavLink to="/blog" className={pillClass}>
                  {blogLabel}
                </NavLink>
              </li>
            )}
            {contactLabel && (
              <li>
                <a href="/#contact" className="pill pill-ink">
                  {contactLabel}
                </a>
              </li>
            )}
          </ul>

          <div className="flex items-center gap-1.5 md:hidden">
            {contactLabel && (
              <a href="/#contact" className="pill pill-ink">
                {contactLabel}
              </a>
            )}
            <details
              open={menuOpen}
              onToggle={(e) => setMenuOpen(e.currentTarget.open)}
              onKeyDown={(e) => {
                if (e.key === "Escape") closeMenu();
              }}
            >
              <summary className="pill min-w-[86px] cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                {menuOpen ? ui.nav.close : ui.nav.menu}
              </summary>
              <div className="absolute inset-x-0 top-full z-40 border-y border-rule bg-paper">
                <ul className={`${WRAP} pb-4`}>
                  {homeLabel && (
                    <li className="border-b border-rule">
                      <NavLink to="/" end onClick={closeMenu} className={menuLinkClass}>
                        {homeLabel}
                        <ArrowIcon className="size-5" />
                      </NavLink>
                    </li>
                  )}
                  {realisationsLabel && (
                    <li className="border-b border-rule">
                      <a href="/#realisations" onClick={closeMenu} className={menuLinkClass}>
                        {realisationsLabel}
                        <ArrowIcon className="size-5" />
                      </a>
                    </li>
                  )}
                  {offresLabel && (
                    <li className="border-b border-rule">
                      <a href="/#offres" onClick={closeMenu} className={menuLinkClass}>
                        {offresLabel}
                        <ArrowIcon className="size-5" />
                      </a>
                    </li>
                  )}
                  {blogLabel && (
                    <li className="border-b border-rule">
                      <NavLink to="/blog" onClick={closeMenu} className={menuLinkClass}>
                        {blogLabel}
                        <ArrowIcon className="size-5" />
                      </NavLink>
                    </li>
                  )}
                  {contactLabel && (
                    <li>
                      <a href="/#contact" onClick={closeMenu} className={menuLinkClass}>
                        {contactLabel}
                        <ArrowIcon className="size-5" />
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </details>
          </div>
        </nav>
      </div>
    </header>
  );
}
