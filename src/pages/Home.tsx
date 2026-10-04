// src/pages/Home.tsx
//
// Assemble les sections du site (une par clé de site.schema.json) et le
// formulaire de contact. Le contenu exact dépend du schéma propre à chaque
// client : nouvelle section = composant dans src/sections/ + entrée dans
// site.schema.json + valeurs dans le seed (voir CLAUDE.md).
import { SiteHead } from "../components/SiteHead";
import { ContactForm } from "../components/ContactForm";
import { useFullSiteContent, useSiteMeta } from "../hooks/site-content-context";
import { siteShareImage } from "../lib/seo";
import { Hero } from "../sections/Hero";
import { Metiers } from "../sections/Metiers";
import { Realisations } from "../sections/Realisations";
import { Testimonials } from "../sections/Testimonials";

export function Home() {
  const { site } = useSiteMeta();
  // Image de partage choisie dans Lea CRM, sinon la photo du bandeau (lib/seo.ts).
  const shareImage = siteShareImage(useFullSiteContent());

  return (
    <>
      <SiteHead title={site.name} image={shareImage} settings={site.settings} />
      <Hero />
      <Realisations />
      <Metiers />
      <Testimonials />
      <ContactForm />
    </>
  );
}
