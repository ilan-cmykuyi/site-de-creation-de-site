// src/lib/aplats.ts
//
// Couleurs d'aplat des cartes d'exemples : la liste fermée du champ
// « Couleur de la carte » (site.schema.json, section realisations), dans le
// même ordre (vérifié par aplats.test.ts). Chaque libellé donne le fond et la
// couleur du texte posé dessus, contraste suffisant compris.
export const APLAT_OPTIONS = ["Jaune", "Noir", "Orange brûlé", "Sable", "Vert profond"] as const;

type Aplat = (typeof APLAT_OPTIONS)[number];

const APLAT_CLASSES: Record<Aplat, string> = {
  Jaune: "bg-jaune text-ink",
  Noir: "bg-ink text-paper",
  "Orange brûlé": "bg-orange text-paper",
  Sable: "bg-sable text-ink",
  "Vert profond": "bg-vert text-paper",
};

function isAplat(value: string | undefined): value is Aplat {
  return (APLAT_OPTIONS as readonly string[]).includes(value ?? "");
}

/**
 * Classes de fond et de texte d'une carte. Couleur absente ou inconnue (valeur
 * reprise d'un ancien contenu) : celle de la liste qui revient à la position
 * de la carte, pour que deux cartes voisines ne se confondent pas.
 */
export function aplatClasses(color: string | undefined, index: number): string {
  return APLAT_CLASSES[isAplat(color) ? color : APLAT_OPTIONS[index % APLAT_OPTIONS.length]];
}
