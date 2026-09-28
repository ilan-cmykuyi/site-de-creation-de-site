// src/pages/Legal.tsx
//
// Page /mentions-legales : identité de l'entreprise (section « legal » de
// site.schema.json) en tête, puis le texte des mentions légales et la
// politique de confidentialité. Son titre est le libellé du lien du pied de
// page (footer.legalLinkLabel) : un seul champ à modifier pour renommer les
// deux. Accessible depuis le pied de page de chaque page (obligation légale).
import { SiteHead } from "../components/SiteHead";
import { useSection, useSiteMeta } from "../hooks/site-content-context";
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
    <div className="mx-auto max-w-3xl px-4 py-16">
      <SiteHead title={legalLinkLabel ?? ""} settings={site.settings} />
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{legalLinkLabel}</h1>
      {rows.length > 0 && (
        <dl className="mt-8 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-slate-50 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-1 px-5 py-3 sm:grid-cols-[14rem_1fr] sm:gap-6">
              <dt className="font-medium text-slate-900">{row.label}</dt>
              <dd className="whitespace-pre-line text-slate-600">{row.value}</dd>
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
      {legalBody && <div className="prose prose-slate mt-10 max-w-none" dangerouslySetInnerHTML={{ __html: legalBody }} />}
      {privacyBody && (
        <div className="prose prose-slate mt-12 max-w-none border-t border-slate-200 pt-10" dangerouslySetInnerHTML={{ __html: privacyBody }} />
      )}
    </div>
  );
}
