// @vitest-environment happy-dom
// @vitest-environment-options {"settings":{"handleDisabledFileLoadingAsSuccess":true}}
//
// Scripts de suivi jamais téléchargés (chargement des fichiers JavaScript
// désactivé dans happy-dom, compté comme réussi) : seuls comptent les
// éléments <script> posés et les entrées de dataLayer.
//
// Une page vue par page : <SiteHead> rappelle injectTrackingIfConsented à
// chaque nouvel objet `settings` (instantané de build, puis cache, puis
// réponse de l'API : mêmes identifiants), et useConsent au clic sur
// Accepter. gtm.js n'est poussé, gtag("config") n'est appelé qu'une fois par
// chemin et par jeu d'identifiants.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SiteSettings } from "../types/site-content";

type Tracking = typeof import("./tracking");
let tracking: Tracking;

beforeEach(async () => {
  // Module neuf à chaque test : dernière page vue et scripts déjà chargés remis à zéro.
  vi.resetModules();
  tracking = await import("./tracking");
  window.dataLayer = [];
  document.head.innerHTML = "";
  window.localStorage.setItem("cookieConsent", "granted");
});

/** Pages vues GTM : entrées `{ event: "gtm.js" }` de dataLayer. */
const gtmPageViews = () => window.dataLayer.filter((entry) => (entry as { event?: string }).event === "gtm.js").length;
/** Appels gtag(command, ...) : GTM et gtag.js rangent l'objet `arguments` lui-même dans dataLayer. */
const gtagCalls = (command: string) => window.dataLayer.filter((entry) => (entry as ArrayLike<unknown>)[0] === command).length;
const scripts = () => [...document.head.querySelectorAll("script")].map((script) => script.src);

describe("injectTrackingIfConsented : une page vue par page", () => {
  it("réglages de même identifiants, objets différents (instantané, cache, live) : un seul gtm.js", () => {
    const fromSnapshot: SiteSettings = { gtmId: "GTM-ABC1234" };
    const fromCache: SiteSettings = { gtmId: "GTM-ABC1234", seo: { titleSuffix: " | Plomberie Martin" } };
    const fromApi: SiteSettings = { gtmId: "GTM-ABC1234", seo: { titleSuffix: " | Plomberie Martin" } };
    for (const settings of [fromSnapshot, fromCache, fromApi]) tracking.injectTrackingIfConsented(settings, "/");
    expect(gtmPageViews()).toBe(1);
    expect(scripts()).toStrictEqual(["https://www.googletagmanager.com/gtm.js?id=GTM-ABC1234"]);
  });

  it("autre chemin : une nouvelle page vue ; retour à une page déjà vue : une nouvelle aussi", () => {
    const settings: SiteSettings = { gtmId: "GTM-ABC1234" };
    tracking.injectTrackingIfConsented(settings, "/");
    tracking.injectTrackingIfConsented({ ...settings }, "/blog");
    tracking.injectTrackingIfConsented({ ...settings }, "/blog");
    expect(gtmPageViews()).toBe(2);
    tracking.injectTrackingIfConsented({ ...settings }, "/");
    expect(gtmPageViews()).toBe(3);
    expect(scripts()).toHaveLength(1);
  });

  it("GA4 sans GTM : gtag(\"config\") une fois par chemin", () => {
    tracking.injectTrackingIfConsented({ ga4Id: "G-ABCDE12345" }, "/");
    tracking.injectTrackingIfConsented({ ga4Id: "G-ABCDE12345" }, "/");
    expect(gtagCalls("config")).toBe(1);
    tracking.injectTrackingIfConsented({ ga4Id: "G-ABCDE12345" }, "/blog");
    expect(gtagCalls("config")).toBe(2);
    expect(scripts()).toStrictEqual(["https://www.googletagmanager.com/gtag/js?id=G-ABCDE12345"]);
  });

  it("autre jeu d'identifiants sur le même chemin : une nouvelle injection", () => {
    tracking.injectTrackingIfConsented({ gtmId: "GTM-ABC1234" }, "/");
    tracking.injectTrackingIfConsented({ gtmId: "GTM-XYZ9876" }, "/");
    expect(gtmPageViews()).toBe(2);
    expect(scripts()).toHaveLength(2);
  });

  it("sans consentement : rien, et la page reste à envoyer une fois le consentement donné", () => {
    window.localStorage.setItem("cookieConsent", "denied");
    tracking.injectTrackingIfConsented({ gtmId: "GTM-ABC1234" }, "/");
    expect(gtmPageViews()).toBe(0);
    window.localStorage.setItem("cookieConsent", "granted");
    tracking.injectTrackingIfConsented({ gtmId: "GTM-ABC1234" }, "/");
    expect(gtmPageViews()).toBe(1);
  });
});
