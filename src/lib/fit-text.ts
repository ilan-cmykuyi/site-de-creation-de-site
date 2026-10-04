// src/lib/fit-text.ts
//
// Texte en capitales Archivo Expanded Black calé sur la largeur de son
// conteneur : le nom géant de l'accueil (src/sections/Hero.tsx) et le nom posé
// sur chaque carte d'exemple (src/sections/Realisations.tsx). Fonction pure,
// identique au prérendu et dans le navigateur : aucune mesure du DOM, donc
// rien qui bouge après l'affichage ni d'écart à l'hydratation.
//
// Le corps est rendu en cqw (1 % de la largeur du conteneur, classe .fit-box
// de src/index.css). Il se déduit des chasses du fichier livré
// (public/fonts/archivo-expanded-black-latin*.woff2, mesurées avec fontTools),
// en em : [chasse, approche gauche, approche droite]. L'encre de la ligne la
// plus large touche les deux bords : on retire l'approche gauche de la
// première lettre (décalage de la ligne vers la gauche) et l'approche droite
// de la dernière. Changer de police impose de reprendre ce tableau.

type Metric = readonly [advance: number, left: number, right: number];

const METRICS: Record<string, Metric> = {
  A: [0.954, 0.008, 0.008], B: [0.93, 0.074, 0.041], C: [0.939, 0.045, 0.045], D: [0.933, 0.074, 0.045],
  E: [0.86, 0.074, 0.043], F: [0.807, 0.074, 0.037], G: [1.012, 0.045, 0.068], H: [1.009, 0.074, 0.074],
  I: [0.395, 0.074, 0.074], J: [0.764, 0.022, 0.065], K: [0.988, 0.074, 0.02], L: [0.786, 0.074, 0.019],
  M: [1.178, 0.074, 0.074], N: [1.007, 0.074, 0.074], O: [1.008, 0.045, 0.045], P: [0.865, 0.074, 0.008],
  Q: [1.008, 0.045, 0.045], R: [0.943, 0.074, 0.025], S: [0.882, 0.043, 0.036], T: [0.877, 0.023, 0.023],
  U: [0.989, 0.074, 0.074], V: [0.938, 0.008, 0.008], W: [1.23, 0.005, 0.005], X: [0.961, 0.012, -0.006],
  Y: [0.966, 0.017, 0.017], Z: [0.877, 0.024, 0.031],
  "0": [0.811, 0.041, 0.041], "1": [0.731, 0.07, 0.02], "2": [0.809, 0.049, 0.048], "3": [0.813, 0.042, 0.042],
  "4": [0.819, 0.023, 0.023], "5": [0.813, 0.039, 0.042], "6": [0.815, 0.041, 0.036], "7": [0.755, 0.02, 0.01],
  "8": [0.828, 0.038, 0.038], "9": [0.815, 0.036, 0.041],
  // Capitales accentuées : la chasse de la lettre, et ses approches à elle
  // (l'accent qui dépasse ne compte pas pour l'alignement).
  À: [0.954, 0.008, 0.008], Â: [0.954, 0.008, 0.008], Ä: [0.954, 0.008, 0.008], Ç: [0.939, 0.045, 0.045],
  É: [0.86, 0.074, 0.043], È: [0.86, 0.074, 0.043], Ê: [0.86, 0.074, 0.043], Ë: [0.86, 0.074, 0.043],
  Î: [0.395, 0.074, 0.074], Ï: [0.395, 0.074, 0.074], Ô: [1.008, 0.045, 0.045], Ö: [1.008, 0.045, 0.045],
  Ù: [0.989, 0.074, 0.074], Û: [0.989, 0.074, 0.074], Ü: [0.989, 0.074, 0.074], Ÿ: [0.966, 0.017, 0.017],
  Æ: [1.252, -0.01, 0.043], Œ: [1.494, 0.045, 0.043],
  "&": [1.065, 0.065, 0.003], "'": [0.324, 0.06, 0.06], "’": [0.324, 0.047, 0.048], "-": [0.416, 0.05, 0.05],
  ".": [0.381, 0.06, 0.06], ",": [0.381, 0.06, 0.06], "!": [0.391, 0.06, 0.06], "?": [0.743, 0.034, 0.048],
  ":": [0.371, 0.06, 0.05], "/": [0.309, 0, 0], "+": [0.75, 0.083, 0.083], "@": [1.24, 0.045, 0.045],
  "#": [0.773, 0.011, 0.01], "(": [0.389, 0.055, 0.034], ")": [0.389, 0.034, 0.055],
};

const SPACE_ADVANCE = 0.29;
/** Caractère absent du tableau : une capitale moyenne, plutôt trop large que trop étroite. */
const FALLBACK: Metric = [1, 0.05, 0.05];
/** Interligne par défaut, en em (multiplicateur de line-height du composant). */
export const FIT_LINE_HEIGHT = 0.9;

export type FitOptions = {
  /** Nombre de lignes au plus ; 1 par défaut (le texte reste sur une ligne, espaces compris). */
  maxLines?: number;
  /** Hauteur totale permise, rapportée à la largeur du conteneur (0,5 = la moitié de sa largeur). Sans valeur : aucune limite. */
  heightRatio?: number;
  /** Interligne en em, le même que celui du rendu. */
  lineHeight?: number;
};

export type FitLayout = {
  /** Lignes, en capitales. Vide si le texte l'est. */
  lines: string[];
  /** Corps du texte, en pourcentage de la largeur du conteneur (unité cqw). */
  size: number;
  /** Décalage vers la gauche de chaque ligne, en em : l'approche gauche de sa première lettre. */
  offsets: number[];
};

function metric(char: string): Metric {
  return METRICS[char] ?? FALLBACK;
}

/** Largeur de l'encre d'une ligne déjà en capitales, en em (de la première à la dernière lettre). */
export function inkWidth(line: string): number {
  const chars = [...line];
  if (chars.length === 0) return 0;
  let width = 0;
  for (const char of chars) width += char === " " ? SPACE_ADVANCE : metric(char)[0];
  return width - metric(chars[0])[1] - metric(chars[chars.length - 1])[2];
}

/**
 * Découpe `words` en `count` lignes consécutives, la plus large étant la
 * plus étroite possible (programmation dynamique, quelques mots au plus).
 */
function balancedLines(words: string[], count: number): { lines: string[]; widest: number } {
  const n = words.length;
  const join = (from: number, to: number) => words.slice(from, to).join(" ");
  // best[k][i] : meilleure largeur maximale pour placer words[i..] sur k lignes.
  const best: number[][] = Array.from({ length: count + 1 }, () => new Array<number>(n + 1).fill(Infinity));
  const cut: number[][] = Array.from({ length: count + 1 }, () => new Array<number>(n + 1).fill(n));
  best[0][n] = 0;
  for (let k = 1; k <= count; k++) {
    for (let i = n - 1; i >= 0; i--) {
      for (let j = i + 1; j <= n - (k - 1); j++) {
        const widest = Math.max(inkWidth(join(i, j)), best[k - 1][j]);
        if (widest < best[k][i]) {
          best[k][i] = widest;
          cut[k][i] = j;
        }
      }
    }
  }
  const lines: string[] = [];
  let i = 0;
  for (let k = count; k >= 1; k--) {
    lines.push(join(i, cut[k][i]));
    i = cut[k][i];
  }
  return { lines, widest: best[count][0] };
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Mise en page du texte : lignes, corps (cqw) et décalages. Parmi 1 à
 * `maxLines` lignes, garde la découpe qui donne le plus grand corps tout en
 * tenant dans la largeur (et la hauteur, si `heightRatio` est donné) ; à
 * corps égal, le moins de lignes.
 */
export function fitText(text: string, options: FitOptions = {}): FitLayout {
  const { maxLines = 1, heightRatio, lineHeight = FIT_LINE_HEIGHT } = options;
  const words = text.toUpperCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { lines: [], size: 0, offsets: [] };

  const sizeFor = (count: number, widest: number) =>
    Math.min(100 / widest, heightRatio === undefined ? Infinity : (100 * heightRatio) / (lineHeight * count));

  const oneLine = words.join(" ");
  let chosen = { lines: [oneLine], size: sizeFor(1, inkWidth(oneLine)) };
  for (let count = 2; count <= Math.min(maxLines, words.length); count++) {
    const { lines, widest } = balancedLines(words, count);
    const size = sizeFor(count, widest);
    if (size > chosen.size + 1e-9) chosen = { lines, size };
  }
  return {
    lines: chosen.lines,
    // Arrondi vers le bas : jamais un millième de trop, qui ferait déborder.
    size: Math.floor(chosen.size * 1000) / 1000,
    offsets: chosen.lines.map((line) => round3(metric([...line][0])[1])),
  };
}
