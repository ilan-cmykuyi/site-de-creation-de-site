import { describe, expect, it } from "vitest";
import type { SiteContent } from "../types/site-content";
import { buildLocalBusiness, serializeJsonLd } from "./structured-data";

const BASE_URL = "https://plomberie-martin.fr";
const HERO_PHOTO = { url: "https://cdn.example.com/bandeau.jpg", alt: "Camionnette de l'entreprise", width: 2000, height: 424 };

/** Sections standard remplies comme un vrai site (voir content.seed.json), plus un bandeau avec photo. */
const SECTIONS: SiteContent["sections"] = {
  hero: { title: "Plomberie Martin, dépannage 7j/7", image: HERO_PHOTO },
  nav: { brandName: "Plomberie Martin", homeLabel: "Accueil", blogLabel: "Blog", contactLabel: "Contact" },
  footer: {
    phone: "01 99 00 12 34",
    email: "contact@plomberie-martin.fr",
    address: "1 rue de l'Exemple\n75001 Paris",
    socials: [{ label: "Facebook", url: "https://www.facebook.com/plomberiemartin" }],
  },
  legal: { companyName: "Plomberie Martin SARL", siret: "000 000 000 00000" },
};

function siteContent(sections: SiteContent["sections"], settings: SiteContent["site"]["settings"] = {}, name = "Nom du site"): SiteContent {
  return {
    site: { name, domains: ["plomberie-martin.fr"], settings, publishedAt: "2026-09-25T11:12:30.331Z" },
    sections,
    articles: [],
  };
}

function withFooter(footer: Record<string, unknown>): SiteContent {
  return siteContent({ ...SECTIONS, footer });
}

describe("buildLocalBusiness", () => {
  it("décrit l'entreprise à partir du menu, du pied de page, des mentions légales et de la photo du bandeau", () => {
    expect(buildLocalBusiness(siteContent(SECTIONS), BASE_URL)).toStrictEqual({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Plomberie Martin",
      legalName: "Plomberie Martin SARL",
      url: "https://plomberie-martin.fr",
      telephone: "01 99 00 12 34",
      email: "contact@plomberie-martin.fr",
      address: {
        "@type": "PostalAddress",
        streetAddress: "1 rue de l'Exemple",
        postalCode: "75001",
        addressLocality: "Paris",
        addressCountry: "FR",
      },
      image: "https://cdn.example.com/bandeau.jpg",
      sameAs: ["https://www.facebook.com/plomberiemartin"],
    });
  });

  it("adresse sur deux lignes : rue, puis code postal et ville", () => {
    expect(buildLocalBusiness(withFooter({ address: "12 avenue Foch\n69006 Lyon" }), BASE_URL)?.address).toStrictEqual({
      "@type": "PostalAddress",
      streetAddress: "12 avenue Foch",
      postalCode: "69006",
      addressLocality: "Lyon",
      addressCountry: "FR",
    });
  });

  it("joint par une virgule les lignes qui précèdent le code postal", () => {
    const address = buildLocalBusiness(withFooter({ address: "Bâtiment B\n  12 avenue Foch  \n\n69006 Lyon" }), BASE_URL)?.address;
    expect(address?.streetAddress).toBe("Bâtiment B, 12 avenue Foch");
  });

  it("adresse sans code postal en dernière ligne : tout dans streetAddress", () => {
    expect(buildLocalBusiness(withFooter({ address: "Zone artisanale des Prés\nLyon" }), BASE_URL)?.address).toStrictEqual({
      "@type": "PostalAddress",
      streetAddress: "Zone artisanale des Prés, Lyon",
      addressCountry: "FR",
    });
  });

  it("ne renvoie rien sans nom, ni téléphone, ni adresse", () => {
    const content = siteContent(
      {
        nav: { brandName: "" },
        footer: { email: "contact@plomberie-martin.fr", phone: "  ", address: "", socials: [{ label: "Facebook", url: "https://www.facebook.com/x" }] },
        legal: { companyName: "Plomberie Martin SARL" },
      },
      {},
      "",
    );
    expect(buildLocalBusiness(content, BASE_URL)).toBeNull();
  });

  it("garde dans sameAs les seules adresses http(s) des réseaux sociaux", () => {
    const business = buildLocalBusiness(
      withFooter({
        phone: "01 99 00 12 34",
        socials: [
          { label: "Facebook", url: "https://www.facebook.com/plomberiemartin" },
          { label: "Blog", url: "http://blog.plomberie-martin.fr" },
          { label: "E-mail", url: "mailto:contact@plomberie-martin.fr" },
          { label: "Page", url: "/contact" },
          { label: "Script", url: "javascript:alert(1)" },
          { label: "Sans adresse" },
        ],
      }),
      BASE_URL,
    );
    expect(business?.sameAs).toStrictEqual(["https://www.facebook.com/plomberiemartin", "http://blog.plomberie-martin.fr"]);
  });

  it("omet les clés vides", () => {
    const content = siteContent({ footer: { phone: "", email: "  ", address: "1 rue de l'Exemple\n75001 Paris", socials: [] } }, {}, "Plomberie Martin");
    expect(buildLocalBusiness(content, null)).toStrictEqual({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Plomberie Martin",
      address: {
        "@type": "PostalAddress",
        streetAddress: "1 rue de l'Exemple",
        postalCode: "75001",
        addressLocality: "Paris",
        addressCountry: "FR",
      },
    });
  });

  it("prend le nom du site quand le nom affiché dans le menu est vide", () => {
    const content = siteContent({ ...SECTIONS, nav: { brandName: "" } }, {}, "Plomberie Martin et fils");
    expect(buildLocalBusiness(content, BASE_URL)?.name).toBe("Plomberie Martin et fils");
  });

  it("prend l'image de partage réglée dans Lea CRM avant la photo du bandeau", () => {
    const settings = { seo: { ogImage: { url: "https://cdn.example.com/partage.jpg", alt: null, width: 1200, height: 630 } } };
    expect(buildLocalBusiness(siteContent(SECTIONS, settings), BASE_URL)?.image).toBe("https://cdn.example.com/partage.jpg");
  });
});

describe("serializeJsonLd", () => {
  it("échappe < pour qu'aucun texte saisi ne puisse fermer la balise <script>", () => {
    const data = { name: "</script><script>alert(1)</script>" };
    const json = serializeJsonLd(data);
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toStrictEqual(data);
  });
});
