// src/sections/Testimonials.tsx
//
// Section « testimonials » de site.schema.json : items[name, quote, photo].
// Le schéma n'a pas de titre de section : en ajouter un = un champ `title`
// dans site.schema.json (côté CRM et ici), jamais un texte en dur.
import { ResponsiveImage } from "../components/ResponsiveImage";
import { useSection } from "../hooks/site-content-context";
import type { PublicImage } from "../types/site-content";

type Testimonial = { name: string; quote: string; photo: PublicImage | null };
type Testimonials = { items: Testimonial[] };

export function Testimonials() {
  const { items } = useSection<Testimonials>("testimonials");
  if (!items || items.length === 0) return null;

  return (
    <section className="bg-slate-50 py-16">
      <ul className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-2">
        {items.map((item, i) => (
          // Pas d'identifiant stable dans un élément de liste (schéma des
          // champs) : l'index est le seul choix raisonnable ici.
          <li key={i} className="rounded-lg bg-white p-6 shadow-sm">
            <blockquote className="text-slate-700">{item.quote}</blockquote>
            <div className="mt-4 flex items-center gap-3">
              <ResponsiveImage image={item.photo} sizes="40px" loading="lazy" className="h-10 w-10 rounded-full object-cover" />
              <p className="text-sm font-medium text-slate-900">{item.name}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
