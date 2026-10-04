import { describe, expect, it } from "vitest";
import { fitText, inkWidth } from "./fit-text";

describe("inkWidth", () => {
  it("additionne les chasses et retire les approches extérieures", () => {
    // B O O S T E R = 6,508 em de chasse, moins 0,074 (B) et 0,025 (R).
    expect(inkWidth("BOOSTER")).toBeCloseTo(6.409, 6);
  });

  it("compte l'espace entre deux mots", () => {
    expect(inkWidth("A A")).toBeCloseTo(0.954 + 0.29 + 0.954 - 0.008 - 0.008, 6);
  });

  it("vaut zéro pour une ligne vide", () => {
    expect(inkWidth("")).toBe(0);
  });
});

describe("fitText", () => {
  it("cale un mot sur toute la largeur, arrondi vers le bas", () => {
    expect(fitText("Booster")).toEqual({ lines: ["BOOSTER"], size: 15.603, offsets: [0.074] });
  });

  it("met en capitales et ignore les espaces superflus", () => {
    expect(fitText("  booster  ")).toEqual(fitText("BOOSTER"));
  });

  it("ne rend rien pour un texte vide", () => {
    expect(fitText("   ")).toEqual({ lines: [], size: 0, offsets: [] });
  });

  it("garde une seule ligne par défaut, espaces compris", () => {
    expect(fitText("Booster Agency").lines).toEqual(["BOOSTER AGENCY"]);
  });

  it("passe à la ligne quand le corps y gagne", () => {
    const layout = fitText("Plombier chauffagiste", { maxLines: 3, heightRatio: 0.5 });
    expect(layout.lines).toEqual(["PLOMBIER", "CHAUFFAGISTE"]);
    expect(layout.size).toBeCloseTo(100 / inkWidth("CHAUFFAGISTE"), 2);
  });

  it("équilibre les lignes : la plus large est la plus étroite possible", () => {
    const { lines } = fitText("Salle de bain à Lyon", { maxLines: 2, heightRatio: 1 });
    expect(lines).toHaveLength(2);
    const widest = Math.max(...lines.map(inkWidth));
    expect(widest).toBeLessThanOrEqual(Math.max(inkWidth("SALLE DE"), inkWidth("BAIN À LYON")));
  });

  it("respecte la hauteur permise", () => {
    const heightRatio = 0.3;
    const layout = fitText("Un nom de projet assez long", { maxLines: 4, heightRatio, lineHeight: 0.9 });
    expect(layout.size * 0.9 * layout.lines.length).toBeLessThanOrEqual(100 * heightRatio + 1e-6);
    expect(layout.size).toBeLessThanOrEqual(100 / Math.max(...layout.lines.map(inkWidth)) + 1e-6);
  });

  it("donne le décalage de la première lettre de chaque ligne", () => {
    const { lines, offsets } = fitText("Plombier chauffagiste", { maxLines: 2, heightRatio: 1 });
    expect(lines.map((line) => line[0])).toEqual(["P", "C"]);
    expect(offsets).toEqual([0.074, 0.045]);
  });

  it("accepte un caractère hors tableau sans échouer", () => {
    const layout = fitText("A★B");
    expect(layout.lines).toEqual(["A★B"]);
    expect(layout.size).toBeGreaterThan(0);
  });
});
