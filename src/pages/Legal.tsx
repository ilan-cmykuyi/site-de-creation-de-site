// src/pages/Legal.tsx
//
// Page /mentions-legales : identité de l'entreprise (section « legal » de
// site.schema.json) en tête, puis le texte des mentions légales et la
// politique de confidentialité. Son titre est le libellé du lien du pied de
// page (footer.legalLinkLabel) : un seul champ à modifier pour renommer les
// deux. Accessible depuis le pied de page de chaque page (obligation légale).
import { SiteHead } from "../components/SiteHead";
import { useSection, useSiteMeta } from "../hooks/site-content-context";
import { PAGE_TITLE, WRAP } from "../lib/layout";
import type { FooterSection, LegalSection } from "../types/standard-sections";
import { ui } from "../ui-strings";

// Option « Autre » du champ companyForm (site.schema.json) : la forme
// juridique est alors précisée dans le texte, et la ligne n'est pas affichée
// (« Forme juridique : Autre » n'apprendrait rien au visiteur).
const OTHER_COMPANY_FORM = "Autre";

export function Legal() {
  const { site } = useSiteMeta();
  const { legalLinkLabel } = useSection<FooterSection>("footer");
  const { companyName, companyForm, siret, publisher, hostingProvider, legalBody, privacyBody } = useSection<LegalSection>("legal");

  const rows = [
    { label: ui.legal.companyName, value: companyName },
    { label: ui.legal.companyForm, value: companyForm === OTHER_COMPANY_FORM ? "" : companyForm },
    { label: ui.legal.siret, value: siret },
    { label: ui.legal.publisher, value: publisher },
    { label: ui.legal.hostingProvider, value: hostingProvider },
  ].filter((row) => row.value);

  return (
    <div className={`${WRAP} pt-8 pb-24 md:pt-12 md:pb-36`}>
      <SiteHead title={legalLinkLabel ?? ""} settings={site.settings} />
      <h1 className={`border-t border-rule pt-8 md:pt-12 ${PAGE_TITLE}`}>{legalLinkLabel}</h1>
      <div className="mt-12 grid gap-x-8 gap-y-12 md:mt-20 lg:grid-cols-12">
        {rows.length > 0 && (
          <dl className="border-b border-rule lg:col-span-4">
            {rows.map((row) => (
              <div key={row.label} className="border-t border-rule py-4">
                <dt className="caps text-muted">{row.label}</dt>
                <dd className="mt-1.5 text-[16px] whitespace-pre-line">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {/*
          legalBody et privacyBody sont des champs richtext, assainis côté
          serveur (lib/sites/sanitize.ts du CRM, liste blanche de balises) à
          CHAQUE enregistrement dans Lea CRM : seule raison pour laquelle
          dangerouslySetInnerHTML est acceptable ici, comme pour le corps d'un
          article. Jamais avec un HTML d'une autre provenance.
        */}
        <div className="lg:col-span-7 lg:col-start-6">
          {legalBody && <div className="prose prose-site max-w-none" dangerouslySetInnerHTML={{ __html: legalBody }} />}
          {privacyBody && (
            <div className="prose prose-site mt-12 max-w-none border-t border-rule pt-10" dangerouslySetInnerHTML={{ __html: privacyBody }} />
          )}
        </div>
      </div>
    </div>
  );
}
