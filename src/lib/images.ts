// src/lib/images.ts
//
// Attributs d'un <img> à partir d'un PublicImage déjà résolu côté CRM.
// Fonction pure, sans JSX : src/components/ResponsiveImage.tsx les pose sur
// l'élément, c'est le seul appelant attendu (voir CLAUDE.md, toute image de
// contenu passe par ce composant).
//
// `srcSet`/`sizes` ne sont posés que si l'image a des variantes
// (PublicImage.srcset, WebP à largeurs croissantes) : aujourd'hui l'API de
// production n'en envoie pas encore, et `sizes` seul, sans `srcset`, ne sert
// à rien pour le navigateur (aucun choix de variante à faire).
import type { PublicImage } from "../types/site-content";

export type ImgAttributes = {
  src: string;
  srcSet: string | undefined;
  sizes: string | undefined;
  width: number | undefined;
  height: number | undefined;
  alt: string;
};

/**
 * `sizes` : l'attribut `sizes` à poser si l'image a des variantes (ignoré
 * sinon). `src` reste toujours `image.url`, l'image d'origine (og:image,
 * JSON-LD : voir src/lib/seo.ts, siteShareImage).
 */
export function imgAttributes(image: PublicImage, sizes?: string): ImgAttributes {
  return {
    src: image.url,
    // Chaîne vide comme absente : jamais d'attribut srcset="" sur l'élément.
    srcSet: image.srcset || undefined,
    sizes: image.srcset ? sizes : undefined,
    width: image.width ?? undefined,
    height: image.height ?? undefined,
    alt: image.alt ?? "",
  };
}
