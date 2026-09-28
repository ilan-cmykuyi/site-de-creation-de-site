// src/sections/Hero.tsx
//
// Section « hero » de site.schema.json : title, subtitle, image, ctaLabel.
// Aucun texte en dur ici : tout vient du contenu (règle ESLint
// i18next/no-literal-string).
import { ResponsiveImage } from "../components/ResponsiveImage";
import { useSection } from "../hooks/site-content-context";
import type { PublicImage } from "../types/site-content";

type Hero = { title: string; subtitle: string; image: PublicImage | null; ctaLabel: string };

export function Hero() {
  const { title, subtitle, image, ctaLabel } = useSection<Hero>("hero");

  return (
    <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-5 text-lg leading-relaxed text-slate-600">{subtitle}</p>}
        {ctaLabel && (
          <a
            href="#contact"
            className="mt-8 inline-flex items-center rounded-md bg-blue-700 px-5 py-3 font-medium text-white shadow-sm hover:bg-blue-800"
          >
            {ctaLabel}
          </a>
        )}
      </div>
      <ResponsiveImage
        image={image}
        sizes="(min-width: 768px) 50vw, 100vw"
        fetchPriority="high"
        className="aspect-[4/3] w-full rounded-xl object-cover shadow-md"
      />
    </section>
  );
}
