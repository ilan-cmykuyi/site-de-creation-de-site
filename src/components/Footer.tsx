// src/components/Footer.tsx
//
// Pied de page, lu dans la section « footer » de site.schema.json (et le nom
// affiché de la section « nav »). Chaque bloc n'est rendu que si le client
// l'a rempli. Le lien vers /mentions-legales (obligatoire) figure sur chaque
// page ; son libellé est lui-même du contenu (footer.legalLinkLabel).
import { Link } from "react-router";
import { useSection, useSiteMeta } from "../hooks/site-content-context";
import { useBrowserValue } from "../hooks/useBrowserValue";
import type { FooterSection, NavSection } from "../types/standard-sections";
import { ui } from "../ui-strings";

/**
 * Année du copyright, lue dans le navigateur (useBrowserValue). Au prérendu
 * et à l'hydratation, celle du build (__BUILD_YEAR__, vite.config.ts) : une
 * page construite en décembre et visitée en janvier s'hydrate sans écart,
 * puis affiche l'année en cours.
 */
function currentYear(): number {
  return new Date().getFullYear();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Les champs `url` sont validés côté CRM (http ou https) ; revérifié ici avant
// d'en faire un lien, par sûreté (contenu repris d'un cache navigateur).
const HTTP_URL_RE = /^https?:\/\//i;

/** Lien `tel:` : chiffres et `+` seulement ; null si le numéro saisi n'en contient pas assez. */
function telHref(phone: string): string | null {
  const dialable = phone.replace(/[^\d+]/g, "");
  return dialable.length >= 4 ? `tel:${dialable}` : null;
}

export function Footer() {
  const { site } = useSiteMeta();
  const { brandName } = useSection<NavSection>("nav");
  const { tagline, phone, email, address, hours, socials, copyright, legalLinkLabel } = useSection<FooterSection>("footer");

  const name = brandName || site.name;
  const year = useBrowserValue(currentYear, __BUILD_YEAR__);
  const tel = phone ? telHref(phone) : null;
  const links = (socials ?? []).filter((s) => s.label && s.url && HTTP_URL_RE.test(s.url));
  const hasContact = Boolean(phone || email || address);

  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-sm">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <p className="text-base font-semibold text-slate-900">{name}</p>
          {tagline && <p className="mt-2 whitespace-pre-line text-slate-600">{tagline}</p>}
          {links.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              {links.map((link, i) => (
                // Pas d'identifiant stable dans un élément de liste : l'index.
                <li key={i}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-slate-700 underline-offset-2 hover:underline">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {hasContact && (
          <div>
            <h2 className="font-semibold text-slate-900">{ui.footer.contact}</h2>
            <address className="mt-2 grid gap-1 not-italic text-slate-600">
              {phone &&
                (tel ? (
                  <a href={tel} className="hover:text-slate-900">
                    {phone}
                  </a>
                ) : (
                  <span>{phone}</span>
                ))}
              {email &&
                (EMAIL_RE.test(email) ? (
                  <a href={`mailto:${email}`} className="hover:text-slate-900">
                    {email}
                  </a>
                ) : (
                  <span>{email}</span>
                ))}
              {address && <span className="whitespace-pre-line">{address}</span>}
            </address>
          </div>
        )}
        {hours && (
          <div>
            <h2 className="font-semibold text-slate-900">{ui.footer.hours}</h2>
            <p className="mt-2 whitespace-pre-line text-slate-600">{hours}</p>
          </div>
        )}
      </div>
      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-slate-500">
          <p>{ui.footer.copyright(year, copyright || name)}</p>
          {legalLinkLabel && (
            <Link to="/mentions-legales" className="hover:text-slate-900">
              {legalLinkLabel}
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
