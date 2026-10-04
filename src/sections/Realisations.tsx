// src/sections/Realisations.tsx
//
// Section « realisations » de site.schema.json : eyebrow, title, allLabel
// (filtre « tout voir »), exampleBadge (mention posée sur les exemples) et
// items[name, category, color, isExample, image, link]. Grille de grandes
// cartes sur deux colonnes : sans photo, un aplat de la couleur choisie et le
// nom calé sur la largeur de la carte ; légende dessous (nom, catégorie).
// Les filtres reprennent les catégories des cartes, dans leur ordre
// d'apparition, dès qu'il y en a au moins deux.
import { useState } from "react";
import { FitText } from "../components/FitText";
import { ArrowIcon } from "../components/Icons";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { Section, SectionTitle } from "../components/Section";
import { useSection } from "../hooks/site-content-context";
import { aplatClasses } from "../lib/aplats";
import type { PublicImage } from "../types/site-content";

type Card = { name?: string; category?: string; color?: string; isExample?: boolean; image?: PublicImage | null; link?: string };
type Realisations = { eyebrow?: string; title?: string; allLabel?: string; exampleBadge?: string; items?: Card[] };
type PlacedCard = Card & { name: string; category: string; index: number };

// Les champs `url` sont validés côté CRM (http ou https) ; revérifié ici avant
// d'en faire un lien, par sûreté (contenu repris d'un cache navigateur).
const HTTP_URL_RE = /^https?:\/\//i;

const zoomOnHover = "motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out group-hover:scale-[1.025]";

function ExampleCard({ card, badge }: { card: PlacedCard; badge?: string }) {
  const href = card.link && HTTP_URL_RE.test(card.link) ? card.link : null;

  const content = (
    <>
      <div className={`relative aspect-[4/3] overflow-hidden rounded-[20px] ${aplatClasses(card.color, card.index)}`}>
        {card.image ? (
          <ResponsiveImage
            image={card.image}
            sizes="(min-width: 768px) 50vw, 100vw"
            loading="lazy"
            className={`absolute inset-0 size-full object-cover ${zoomOnHover}`}
          />
        ) : (
          <div className={`absolute inset-0 flex flex-col justify-end p-5 md:p-7 lg:p-8 ${zoomOnHover}`}>
            {/* Le nom est déjà lu dans la légende : version géante masquée aux lecteurs d'écran. */}
            <FitText value={card.name} maxLines={3} heightRatio={0.5} decorative />
          </div>
        )}
        {card.isExample && badge && (
          <span className="caps absolute top-4 left-4 inline-flex min-h-7 items-center rounded-full bg-paper px-3 text-ink md:top-6 md:left-6">
            {badge}
          </span>
        )}
        {href && (
          <span className="absolute top-4 right-4 inline-flex size-9 items-center justify-center rounded-full bg-paper text-ink md:top-6 md:right-6">
            <ArrowIcon className="size-4 -rotate-45" />
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-col gap-1.5">
        <h3 className="text-[17px] leading-snug font-medium md:text-[19px]">{card.name}</h3>
        {card.category && <p className="caps text-muted">{card.category}</p>}
      </div>
    </>
  );

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="group block">
      {content}
    </a>
  ) : (
    <div className="group">{content}</div>
  );
}

export function Realisations() {
  const { eyebrow, title, allLabel, exampleBadge, items } = useSection<Realisations>("realisations");
  const [filter, setFilter] = useState<string | null>(null);

  // Position d'origine gardée : la couleur par défaut d'une carte ne change pas quand on filtre.
  const cards: PlacedCard[] = (items ?? [])
    .map((card, index) => ({ ...card, name: card.name?.trim() ?? "", category: card.category?.trim() ?? "", index }))
    .filter((card) => card.name);
  if (cards.length === 0) return null;

  const categories = [...new Set(cards.map((card) => card.category).filter(Boolean))];
  const showFilters = Boolean(allLabel) && categories.length > 1;
  const active = showFilters ? filter : null;
  const visible = active ? cards.filter((card) => card.category === active) : cards;

  return (
    <Section id="realisations" eyebrow={eyebrow}>
      <SectionTitle>{title}</SectionTitle>
      {showFilters && (
        <div className="mt-10 flex flex-wrap gap-1.5 md:mt-14">
          <button type="button" aria-pressed={active === null} onClick={() => setFilter(null)} className={active === null ? "pill pill-ink" : "pill"}>
            {allLabel}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={active === category}
              onClick={() => setFilter(category)}
              className={active === category ? "pill pill-ink" : "pill"}
            >
              {category}
            </button>
          ))}
        </div>
      )}
      {/* Nouvelle clé à chaque filtre : la grille réapparaît en fondu. */}
      <ul
        key={active ?? ""}
        className="mt-6 grid gap-x-4 gap-y-10 motion-safe:animate-[fade-in_450ms_ease-out] md:mt-8 md:grid-cols-2 md:gap-x-6 md:gap-y-14 lg:gap-x-8"
      >
        {visible.map((card) => (
          <li key={card.index} className="reveal">
            <ExampleCard card={card} badge={exampleBadge} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
