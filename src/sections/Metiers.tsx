// src/sections/Metiers.tsx
//
// Section « metiers » de site.schema.json : eyebrow, title (facultatif) et
// items[name], la rangée des métiers servis : de grandes pastilles gris
// clair, qui passent à la ligne selon la largeur.
import { Section, SectionTitle } from "../components/Section";
import { useSection } from "../hooks/site-content-context";

type Metiers = { eyebrow?: string; title?: string; items?: { name?: string }[] };

export function Metiers() {
  const { eyebrow, title, items } = useSection<Metiers>("metiers");
  const names = (items ?? []).map((item) => item.name?.trim() ?? "").filter(Boolean);
  if (names.length === 0) return null;

  return (
    <Section eyebrow={eyebrow}>
      <SectionTitle>{title}</SectionTitle>
      <ul className="reveal mt-12 flex flex-wrap gap-2 md:mt-16 md:gap-3">
        {names.map((name, i) => (
          // Libellés sans identifiant stable (liste du schéma) : l'index.
          <li
            key={i}
            className="inline-flex min-h-12 items-center rounded-full bg-pill px-5 text-[18px] font-medium tracking-[-0.01em] md:min-h-16 md:px-7 md:text-[24px] lg:min-h-[72px] lg:px-8 lg:text-[28px]"
          >
            {name}
          </li>
        ))}
      </ul>
    </Section>
  );
}
