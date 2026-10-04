// src/components/Section.tsx
//
// Gabarit commun des sections de l'accueil : une étiquette minuscule en
// capitales espacées, posée sur un filet d'un pixel, puis beaucoup d'air.
// La grande phrase (SectionTitle) porte le message. Tous les textes viennent
// de la section appelante (contenu de Lea CRM).
import type { ReactNode } from "react";
import { SECTION_SPACE, TITLE, WRAP } from "../lib/layout";

/** Étiquette sur filet ; `aside` se place à droite, sur la même ligne (filtres, lien). */
export function Eyebrow({ children, aside }: { children?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex min-h-12 flex-wrap items-start justify-between gap-x-6 gap-y-4 border-t border-rule pt-3">
      {children ? <p className="caps">{children}</p> : <span />}
      {aside}
    </div>
  );
}

type SectionProps = {
  id?: string;
  eyebrow?: string;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Section({ id, eyebrow, aside, className, children }: SectionProps) {
  return (
    <section id={id} className={`${WRAP} ${SECTION_SPACE} ${className ?? ""}`}>
      <Eyebrow aside={aside}>{eyebrow}</Eyebrow>
      {children}
    </section>
  );
}

/** La grande phrase d'une section (h2). Rien si le client l'a laissée vide. */
export function SectionTitle({ children, className }: { children?: ReactNode; className?: string }) {
  if (!children) return null;
  return <h2 className={`reveal mt-10 max-w-[24ch] md:mt-16 ${TITLE} ${className ?? ""}`}>{children}</h2>;
}
