// src/types/standard-sections.ts
//
// Sections communes à tous les sites dérivés de ce gabarit (site.schema.json) :
// `nav` (menu), `footer` (pied de page) et `legal` (mentions légales). Tous
// les champs sont optionnels : un site branché avant l'ajout de ces sections
// ne les a pas encore dans son contenu publié, et les composants doivent
// alors rendre ce qu'ils ont, sans casser.

/** Section `nav` : nom affiché, ligne d'annonce et libellés des entrées du menu (une par page fixe, plus deux ancres de l'accueil). */
export type NavSection = {
  brandName?: string;
  homeLabel?: string;
  blogLabel?: string;
  contactLabel?: string;
  /** Phrase courte tout en haut de chaque page ; vide, la ligne n'est pas affichée. */
  announcement?: string;
  /** Lien vers la section des exemples de l'accueil (#realisations) ; vide, l'entrée disparaît. */
  realisationsLabel?: string;
  /** Lien vers la section des offres de l'accueil (#offres) ; vide, l'entrée disparaît. */
  offresLabel?: string;
};

export type SocialLink = { label?: string; url?: string };

/** Section `footer`. */
export type FooterSection = {
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  socials?: SocialLink[];
  /** Texte après « © <année> », saisi dans Lea CRM. */
  copyright?: string;
  /** Libellé du lien vers /mentions-legales, et titre de cette page. */
  legalLinkLabel?: string;
};

/** Section `legal`. `legalBody` et `privacyBody` sont des richtext assainis côté CRM. */
export type LegalSection = {
  companyName?: string;
  companyForm?: string;
  siret?: string;
  publisher?: string;
  hostingProvider?: string;
  legalBody?: string;
  privacyBody?: string;
};
