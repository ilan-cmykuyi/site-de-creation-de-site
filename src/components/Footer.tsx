// src/components/Footer.tsx
//
// Pied de page, lu dans la section « footer » de site.schema.json (et le nom
// affiché de la section « nav »). Chaque bloc n'est rendu que si le client
// l'a rempli. Le lien vers /mentions-legales (obligatoire) figure sur chaque
// page ; son libellé est lui-même du contenu (footer.legalLinkLabel).
import { Link } from "react-router";
import { useSection, useSiteMeta } from "../hooks/site-content-context";
import { useBrowserValue } from "../hooks/useBrowserValue";
import { WRAP } from "../lib/layout";
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

const headingClass = "caps text-muted";
const linkClass = "underline-offset-4 hover:underline";

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
    <footer className={WRAP}>
      <div className="grid gap-x-8 gap-y-10 border-t border-rule pt-10 pb-14 md:grid-cols-12 md:pt-14 md:pb-20">
        <div className="md:col-span-12 lg:col-span-4">
          <p className="font-display text-[17px] leading-none uppercase">{name}</p>
          {tagline && (
            <p className="mt-5 max-w-[34ch] text-[20px] leading-[1.3] font-medium tracking-[-0.01em] text-balance whitespace-pre-line md:text-[22px]">
              {tagline}
            </p>
          )}
        </div>
        {hasContact && (
          <div className="md:col-span-4 lg:col-span-3 lg:col-start-6">
            <h2 className={headingClass}>{ui.footer.contact}</h2>
            <address className="mt-4 grid gap-1.5 text-[16px] not-italic">
              {phone &&
                (tel ? (
                  <a href={tel} className={linkClass}>
                    {phone}
                  </a>
                ) : (
                  <span>{phone}</span>
                ))}
              {email &&
                (EMAIL_RE.test(email) ? (
                  <a href={`mailto:${email}`} className={linkClass}>
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
          <div className="md:col-span-4 lg:col-span-2">
            <h2 className={headingClass}>{ui.footer.hours}</h2>
            <p className="mt-4 text-[16px] whitespace-pre-line">{hours}</p>
          </div>
        )}
        {links.length > 0 && (
          <div className="md:col-span-4 lg:col-span-2">
            <h2 className={headingClass}>{ui.footer.socials}</h2>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {links.map((link, i) => (
                // Pas d'identifiant stable dans un élément de liste : l'index.
                <li key={i}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="pill">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-rule py-5 text-[13px] text-muted">
        <p>{ui.footer.copyright(year, copyright || name)}</p>
        {legalLinkLabel && (
          <Link to="/mentions-legales" className={`${linkClass} hover:text-ink`}>
            {legalLinkLabel}
          </Link>
        )}
      </div>
    </footer>
  );
}
