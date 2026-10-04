// src/sections/Hero.tsx
//
// Section « hero » de site.schema.json : wordmark (le nom géant), title
// (l'accroche, seul h1 de l'accueil), subtitle, ctaLabel, image (visuel large
// facultatif). Le nom géant est calé sur toute la largeur de l'écran par
// FitText, sans mesure dans le navigateur. Aucun texte en dur ici : tout
// vient du contenu (règle ESLint i18next/no-literal-string).
import { FitText } from "../components/FitText";
import { ArrowIcon } from "../components/Icons";
import { ResponsiveImage } from "../components/ResponsiveImage";
import { useSection, useSiteMeta } from "../hooks/site-content-context";
import { BODY, WRAP } from "../lib/layout";
import type { PublicImage } from "../types/site-content";

type Hero = { wordmark?: string; title?: string; subtitle?: string; image?: PublicImage | null; ctaLabel?: string };

export function Hero() {
  const { site } = useSiteMeta();
  const { wordmark, title, subtitle, image, ctaLabel } = useSection<Hero>("hero");

  return (
    <section className={`${WRAP} pt-4 md:pt-6`}>
      {/* Nom géant : le nom du site si le client l'a laissé vide. Calé sur l'encre, il touche les deux marges. */}
      <p className="pb-6 md:pb-10">
        <FitText value={wordmark || site.name} lineHeight={0.8} />
      </p>
      <div className="grid gap-x-8 gap-y-8 border-t border-rule pt-6 md:pt-8 lg:grid-cols-12">
        {title && (
          <h1 className="text-[36px] leading-[1.04] font-medium tracking-[-0.03em] text-balance md:text-[52px] lg:col-span-8 lg:text-[64px]">
            {title}
          </h1>
        )}
        {(subtitle || ctaLabel) && (
          <div className="flex flex-col items-start justify-end gap-7 lg:col-span-4 lg:col-start-9">
            {subtitle && <p className={`max-w-[46ch] text-muted ${BODY} md:text-[18px]`}>{subtitle}</p>}
            {ctaLabel && (
              <a href="#contact" className="button">
                {ctaLabel}
                <ArrowIcon />
              </a>
            )}
          </div>
        )}
      </div>
      <ResponsiveImage
        image={image ?? null}
        sizes="(min-width: 1680px) 1616px, 100vw"
        fetchPriority="high"
        className="mt-10 aspect-[4/3] w-full rounded-[20px] object-cover md:mt-16 md:aspect-[21/9]"
      />
    </section>
  );
}
