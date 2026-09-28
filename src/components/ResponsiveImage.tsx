// src/components/ResponsiveImage.tsx
//
// Toute image de contenu (un champ `image` du CRM déjà résolu en
// PublicImage) passe par ce composant, jamais un <img> écrit à la main : voir
// CLAUDE.md. Ne rend rien si `image` est absent, comme les `{image && (...)}`
// qu'il remplace dans les sections et les pages.
import { imgAttributes } from "../lib/images";
import type { PublicImage } from "../types/site-content";

type ResponsiveImageProps = {
  image: PublicImage | null;
  /** Attribut `sizes` ; posé seulement si l'image a des variantes (image.srcset), voir src/lib/images.ts. */
  sizes?: string;
  className?: string;
  loading?: "lazy" | "eager";
  /** "high" pour l'image la plus visible au premier écran (le bandeau) ; jamais en même temps que loading="lazy". */
  fetchPriority?: "high" | "low" | "auto";
};

export function ResponsiveImage({ image, sizes, className, loading, fetchPriority }: ResponsiveImageProps) {
  if (!image) return null;
  const { src, srcSet, sizes: sizesAttr, width, height, alt } = imgAttributes(image, sizes);
  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizesAttr}
      width={width}
      height={height}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      fetchPriority={fetchPriority}
    />
  );
}
