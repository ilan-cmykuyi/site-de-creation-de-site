// src/components/StructuredData.tsx
import { useFullSiteContent } from "../hooks/site-content-context";
import { useHead } from "../lib/head";
import { siteBaseUrl } from "../lib/seo";
import { buildLocalBusiness, serializeJsonLd } from "../lib/structured-data";

const SCRIPT_ID = "ld-local-business";

/**
 * Ne rend rien : déclare (useHead, lib/head.ts) le JSON-LD LocalBusiness du
 * site (lib/structured-data.ts), écrit dans le HTML prérendu au build puis
 * remplacé dans le navigateur quand le contenu change (cache, contenu frais
 * de l'API) ou retiré si le contenu n'a plus de quoi le remplir. Rendu une
 * fois pour tout le site, par Layout.
 */
export function StructuredData() {
  const content = useFullSiteContent();
  const business = buildLocalBusiness(content, siteBaseUrl(content.site.domains));
  useHead([{ kind: "json-ld", id: SCRIPT_ID, json: business ? serializeJsonLd(business) : undefined }]);
  return null;
}
