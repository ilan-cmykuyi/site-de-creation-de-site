import { describe, expect, it } from "vitest";
import schema from "../../site.schema.json";
import { APLAT_OPTIONS, aplatClasses } from "./aplats";

type Field = { key: string; options?: string[]; fields?: Field[] };

describe("aplats", () => {
  it("reprend exactement la liste fermée du schéma, dans le même ordre", () => {
    const section = schema.sections.find((s) => s.key === "realisations") as { fields: Field[] } | undefined;
    const color = section?.fields.find((f) => f.key === "items")?.fields?.find((f) => f.key === "color");
    expect(color?.options).toEqual([...APLAT_OPTIONS]);
  });

  it("donne le fond et le texte de la couleur choisie", () => {
    expect(aplatClasses("Noir", 0)).toBe("bg-ink text-paper");
    expect(aplatClasses("Sable", 4)).toBe("bg-sable text-ink");
  });

  it("alterne les couleurs quand aucune n'est choisie", () => {
    expect(aplatClasses("", 0)).toBe(aplatClasses("Jaune", 0));
    expect(aplatClasses(undefined, 1)).toBe(aplatClasses("Noir", 1));
    expect(aplatClasses("Violet", 7)).toBe(aplatClasses(APLAT_OPTIONS[2], 7));
  });
});
