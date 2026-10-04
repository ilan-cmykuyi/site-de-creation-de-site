// src/sections/Methode.tsx
//
// Section « methode » de site.schema.json : eyebrow, title et
// steps[title, text], les étapes de la création d'un site, de la première
// discussion à la mise en ligne. Les numéros (01, 02…) sont calculés : le
// client réordonne ou ajoute une étape sans rien renuméroter.
import { Section, SectionTitle } from "../components/Section";
import { useSection } from "../hooks/site-content-context";
import { BODY } from "../lib/layout";

type Methode = { eyebrow?: string; title?: string; steps?: { title?: string; text?: string }[] };

export function Methode() {
  const { eyebrow, title, steps } = useSection<Methode>("methode");
  const list = (steps ?? []).filter((step) => step.title?.trim());
  if (list.length === 0) return null;

  return (
    <Section eyebrow={eyebrow}>
      <SectionTitle>{title}</SectionTitle>
      <ol className="mt-12 border-b border-rule md:mt-20">
        {list.map((step, i) => (
          // Étapes sans identifiant stable (liste du schéma) : l'index, qui fait aussi le numéro.
          <li
            key={i}
            className="reveal grid grid-cols-[3.25rem_1fr] gap-x-4 gap-y-2 border-t border-rule py-6 md:grid-cols-12 md:gap-x-6 md:py-9 lg:gap-x-8"
          >
            {/* Numéro visuel : la liste ordonnée le donne déjà aux lecteurs d'écran. */}
            <span aria-hidden="true" className="font-display text-[22px] leading-none md:col-span-2 md:text-[36px] lg:text-[44px]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="text-[22px] leading-tight font-medium tracking-[-0.015em] text-balance md:col-span-4 md:text-[28px] lg:text-[32px]">
              {step.title}
            </h3>
            {step.text && <p className={`col-start-2 max-w-[52ch] text-muted md:col-span-6 md:col-start-auto ${BODY} md:text-[18px]`}>{step.text}</p>}
          </li>
        ))}
      </ol>
    </Section>
  );
}
