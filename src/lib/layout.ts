// src/lib/layout.ts
//
// Classes partagées de la mise en page (Tailwind), pour que chaque section
// ait les mêmes marges et la même échelle de titres.

/** Largeur utile : toute la largeur de l'écran, 1680 px au plus, gouttières de 16, 24 puis 32 px. */
export const WRAP = "mx-auto w-full max-w-[1680px] px-4 md:px-6 lg:px-8";

/** Air au-dessus de chaque section de l'accueil. */
export const SECTION_SPACE = "pt-24 md:pt-36 lg:pt-44";

/** La grande phrase d'une section (son titre). */
export const TITLE =
  "text-[34px] leading-[1.06] font-medium tracking-[-0.025em] text-balance md:text-[48px] lg:text-[64px]";

/** Le titre d'une page autre que l'accueil (blog, mentions légales, page introuvable). */
export const PAGE_TITLE = "text-[44px] leading-[1] font-medium tracking-[-0.035em] text-balance md:text-[72px] lg:text-[96px]";

/** Le texte courant posé sous un titre ou dans une carte. */
export const BODY = "text-[16px] leading-relaxed text-pretty md:text-[17px]";
