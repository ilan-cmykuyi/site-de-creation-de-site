import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ResponsiveImage } from "../components/ResponsiveImage";
import type { PublicImage } from "../types/site-content";
import { imgAttributes } from "./images";

const BASE: PublicImage = { url: "https://cdn.example.com/bandeau.jpg", alt: "Camionnette de l'entreprise", width: 2000, height: 424 };
const SIZES = "(min-width: 768px) 50vw, 100vw";

describe("imgAttributes", () => {
  it("sans srcset : src/width/height/alt posés, srcSet et sizes absents même si un sizes est demandé", () => {
    expect(imgAttributes(BASE, SIZES)).toStrictEqual({
      src: BASE.url,
      srcSet: undefined,
      sizes: undefined,
      width: 2000,
      height: 424,
      alt: "Camionnette de l'entreprise",
    });
  });

  it("avec srcset : srcSet et sizes posés, url d'origine gardée dans src", () => {
    const withSrcset: PublicImage = { ...BASE, srcset: `${BASE.url}?w=480 480w, ${BASE.url}?w=960 960w` };
    expect(imgAttributes(withSrcset, SIZES)).toStrictEqual({
      src: BASE.url,
      srcSet: withSrcset.srcset,
      sizes: SIZES,
      width: 2000,
      height: 424,
      alt: "Camionnette de l'entreprise",
    });
  });

  it("avec srcset mais sans sizes demandé : sizes reste absent (jamais posé seul)", () => {
    const withSrcset: PublicImage = { ...BASE, srcset: `${BASE.url}?w=480 480w` };
    expect(imgAttributes(withSrcset).sizes).toBeUndefined();
    expect(imgAttributes(withSrcset).srcSet).toBe(withSrcset.srcset);
  });

  it("srcset vide : srcSet et sizes absents, jamais d'attribut srcset vide", () => {
    const attributes = imgAttributes({ ...BASE, srcset: "" }, SIZES);
    expect(attributes.srcSet).toBeUndefined();
    expect(attributes.sizes).toBeUndefined();
    expect(renderToStaticMarkup(createElement(ResponsiveImage, { image: { ...BASE, srcset: "" }, sizes: SIZES }))).not.toMatch(/srcset|sizes/i);
  });

  it("alt absent (null) : chaîne vide, jamais null sur l'attribut DOM", () => {
    expect(imgAttributes({ ...BASE, alt: null }, SIZES).alt).toBe("");
  });

  it("largeur/hauteur absentes (null) : attributs absents plutôt que null", () => {
    expect(imgAttributes({ ...BASE, width: null, height: null }, SIZES)).toMatchObject({ width: undefined, height: undefined });
  });
});
