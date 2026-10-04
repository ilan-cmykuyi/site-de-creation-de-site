// src/sections/Testimonials.tsx
//
// Section « testimonials » de site.schema.json : eyebrow, title et
// items[name, quote, photo]. Vide au départ : la section n'est pas rendue
// tant qu'aucun témoignage complet (nom et texte) n'est saisi dans Lea CRM.
// Jamais de témoignage inventé dans content.seed.json.
import { ResponsiveImage } from "../components/ResponsiveImage";
import { Section, SectionTitle } from "../components/Section";
import { useSection } from "../hooks/site-content-context";
import type { PublicImage } from "../types/site-content";
import { ui } from "../ui-strings";

type Testimonial = { name?: string; quote?: string; photo?: PublicImage | null };
type Testimonials = { eyebrow?: string; title?: string; items?: Testimonial[] };

export function Testimonials() {
  const { eyebrow, title, items } = useSection<Testimonials>("testimonials");
  const list = (items ?? []).filter((item) => item.name?.trim() && item.quote?.trim());
  if (list.length === 0) return null;

  return (
    <Section eyebrow={eyebrow}>
      <SectionTitle>{title}</SectionTitle>
      <ul className="mt-12 grid gap-x-6 gap-y-12 md:mt-20 md:grid-cols-2 lg:gap-x-8">
        {list.map((item, i) => (
          // Pas d'identifiant stable dans un élément de liste (schéma des
          // champs) : l'index est le seul choix raisonnable ici.
          <li key={i} className="reveal border-t border-ink pt-6">
            <figure>
              <blockquote className="text-[22px] leading-[1.3] font-medium tracking-[-0.015em] text-pretty md:text-[26px] lg:text-[30px]">
                {ui.testimonials.quote(item.quote ?? "")}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <ResponsiveImage image={item.photo ?? null} sizes="40px" loading="lazy" className="size-10 rounded-full object-cover" />
                <span className="caps text-muted">{item.name}</span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
