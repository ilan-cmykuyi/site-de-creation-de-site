// src/sections/Offres.tsx
//
// Section « offres » de site.schema.json : eyebrow, title et
// items[name, audience, includes, price, ctaLabel, highlighted]. Une carte
// par offre ; « ce qu'elle comprend » est un texte à une ligne par élément
// (pas de liste imbriquée dans le schéma), le prix est en texte libre, et
// l'offre mise en avant passe sur fond noir. Le bouton mène au formulaire.
import { ArrowIcon, CheckIcon } from "../components/Icons";
import { Section, SectionTitle } from "../components/Section";
import { useSection } from "../hooks/site-content-context";
import { BODY } from "../lib/layout";

type Offre = { name?: string; audience?: string; includes?: string; price?: string; ctaLabel?: string; highlighted?: boolean };
type Offres = { eyebrow?: string; title?: string; items?: Offre[] };

const COLUMNS: Record<number, string> = { 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" };

// Couleurs d'une carte, claire (gris) ou mise en avant (noire).
const LIGHT = { card: "bg-mist", soft: "text-muted", rule: "border-rule", button: "button" };
const DARK = { card: "bg-ink text-paper", soft: "text-paper/70", rule: "border-paper/20", button: "button button-light" };

export function Offres() {
  const { eyebrow, title, items } = useSection<Offres>("offres");
  const list = (items ?? []).filter((offre) => offre.name?.trim());
  if (list.length === 0) return null;

  return (
    <Section id="offres" eyebrow={eyebrow}>
      <SectionTitle>{title}</SectionTitle>
      <ul className={`mt-12 grid gap-4 md:mt-20 lg:gap-6 ${COLUMNS[list.length] ?? ""}`}>
        {list.map((offre, i) => {
          const tone = offre.highlighted ? DARK : LIGHT;
          const lines = (offre.includes ?? "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
          return (
            // Offres sans identifiant stable (liste du schéma) : l'index.
            <li key={i} className={`reveal flex flex-col rounded-[20px] p-6 md:p-8 ${tone.card}`}>
              <h3 className="text-[28px] leading-tight font-medium tracking-[-0.02em] md:text-[32px]">{offre.name}</h3>
              {offre.audience && <p className={`mt-3 ${BODY} ${tone.soft}`}>{offre.audience}</p>}
              {lines.length > 0 && (
                <ul className={`mt-8 border-t ${tone.rule}`}>
                  {lines.map((line, j) => (
                    <li key={j} className={`flex gap-3 border-b py-3 text-[15px] leading-snug md:text-[16px] ${tone.rule}`}>
                      <CheckIcon className="mt-0.5 size-4 shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
              )}
              {(offre.price || offre.ctaLabel) && (
                <div className="mt-auto flex flex-col items-start gap-6 pt-10">
                  {offre.price && <p className="text-[24px] leading-tight font-medium tracking-[-0.01em] md:text-[28px]">{offre.price}</p>}
                  {offre.ctaLabel && (
                    <a href="#contact" className={tone.button}>
                      {offre.ctaLabel}
                      <ArrowIcon />
                    </a>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
