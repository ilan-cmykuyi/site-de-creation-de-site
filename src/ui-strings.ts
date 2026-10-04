// src/ui-strings.ts
//
// SEULE source autorisée de texte visible hors contenu de Lea CRM.
//
// Tout ce que le client ne modifie pas depuis le CRM (libellés et messages du
// formulaire, états vides, erreurs, bannière de consentement, intitulés fixes
// du pied de page et des mentions légales) vit ici, en français, et les
// composants l'importent. La règle ESLint i18next/no-literal-string
// (src/**/*.tsx, voir eslint.config.js) refuse tout texte écrit en dur dans
// le JSX : un texte qui manque ici se voit au lint, pas en production. Tout
// le reste (titres, textes et images des sections, libellés du menu et des
// pages, pied de page, mentions légales, articles) vient du contenu publié,
// via useSection() et useSiteMeta().
export const ui = {
  /** Locale de mise en forme des dates (Intl). */
  locale: "fr-FR",
  /** Fuseau des dates affichées (Intl), le même au prérendu et dans le navigateur : voir lib/format.ts. */
  timeZone: "Europe/Paris",
  preview: {
    badge: "Aperçu du brouillon : ce que vous voyez n'est pas encore publié.",
  },
  nav: {
    /** Bouton du menu sur téléphone, menu fermé puis ouvert. */
    menu: "Menu",
    close: "Fermer",
  },
  testimonials: {
    /** Un témoignage entre guillemets français, espaces insécables comprises. */
    quote: (text: string) => `«\u00a0${text.trim()}\u00a0»`,
  },
  blog: {
    empty: "Aucun article pour l'instant.",
    loading: "Chargement de l'article…",
    unavailable: "Cet article est introuvable ou temporairement indisponible.",
    /** Titre de la page (onglet) quand l'article est introuvable ou indisponible ; la page est alors en noindex. */
    unavailableTitle: "Article indisponible",
    /** Lien de retour vers la liste ; `label` = libellé du blog dans le menu (nav.blogLabel). */
    back: (label: string) => `← ${label}`,
  },
  form: {
    title: "Contactez-nous",
    name: "Nom",
    email: "E-mail",
    phone: "Téléphone",
    company: "Société",
    message: "Message",
    honeypot: "Laissez ce champ vide",
    send: "Envoyer",
    sending: "Envoi…",
    success: "Merci, votre message a bien été envoyé.",
    missingContact: "Indiquez au moins un e-mail ou un téléphone.",
    rateLimited: (seconds: number | null) =>
      seconds ? `Trop de messages envoyés, réessayez dans ${seconds} secondes.` : "Trop de messages envoyés, réessayez dans une minute.",
    error: "Une erreur est survenue, réessayez.",
  },
  consent: {
    text: "Ce site utilise des outils de mesure d'audience, uniquement si vous l'acceptez.",
    accept: "Accepter",
    refuse: "Refuser",
  },
  footer: {
    contact: "Coordonnées",
    hours: "Horaires",
    /** Le symbole et l'année devant la mention saisie dans Lea CRM (footer.copyright). */
    copyright: (year: number, text: string) => `© ${year} ${text}`,
  },
  notFound: {
    title: "Page introuvable",
    text: "Cette page n'existe pas ou n'existe plus.",
    /** Lien vers l'accueil ; `label` = libellé de l'accueil dans le menu (nav.homeLabel), sinon le nom du site. */
    back: (label: string) => `← ${label}`,
  },
  legal: {
    companyName: "Raison sociale",
    companyForm: "Forme juridique",
    siret: "SIRET",
    publisher: "Directeur de la publication",
    hostingProvider: "Hébergeur",
  },
} as const;
