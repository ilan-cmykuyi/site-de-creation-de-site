// src/components/FitText.tsx
//
// Texte en capitales Archivo Expanded Black calé sur la largeur de son
// conteneur (nom géant de l'accueil, nom posé sur une carte d'exemple). La
// mise en page vient de fitText (src/lib/fit-text.ts), le corps est en cqw :
// aucune mesure dans le navigateur, le HTML prérendu est déjà juste.
import { FIT_LINE_HEIGHT, fitText, type FitOptions } from "../lib/fit-text";

type FitTextProps = FitOptions & {
  value: string;
  className?: string;
  /**
   * Texte déjà lisible ailleurs (la légende d'une carte) : masqué aux
   * lecteurs d'écran. Obligatoire dès que le texte peut tenir sur plusieurs
   * lignes, que les lecteurs liraient sans espace entre elles.
   */
  decorative?: boolean;
};

export function FitText({ value, className, decorative = false, ...options }: FitTextProps) {
  const { lines, size, offsets } = fitText(value, options);
  if (lines.length === 0) return null;

  return (
    <span className={`fit-box block ${className ?? ""}`} aria-hidden={decorative || undefined}>
      <span className="fit-text block" style={{ fontSize: `${size}cqw`, lineHeight: options.lineHeight ?? FIT_LINE_HEIGHT }}>
        {lines.map((line, i) => (
          // Les lignes d'un même texte ne changent pas d'ordre : l'index suffit.
          <span key={i} className="block" style={{ marginLeft: `${-offsets[i]}em` }}>
            {line}
          </span>
        ))}
      </span>
    </span>
  );
}
