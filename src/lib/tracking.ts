// src/lib/tracking.ts
//
// Suivi (GTM, GA4, Pixel Meta) sous consentement. Deux règles non
// négociables (RGPD, Consent Mode v2) :
// 1. Rien n'est chargé tant que le visiteur n'a pas accepté (useConsent()).
// 2. Consent Mode v2 est initialisé (tout refusé par défaut) AVANT que quoi
//    que ce soit de Google ne se charge, pour que les tags respectent le
//    consentement dès leur premier tir : initConsentMode() dans main.tsx.
//
// Squelette volontairement minimal : une bannière deux boutons
// (src/components/ConsentBanner.tsx). Pour une intégration tarteaucitron ou
// équivalent, brancher ses callbacks sur updateConsentMode() et
// injectTrackingIfConsented(), et remplacer readConsentChoice() par la
// lecture de son état.
//
// gtmId, ga4Id et metaPixelId sont validés par format côté CRM
// (lib/sites/settings.ts) : des identifiants, jamais du code à coller.
import type { SiteSettings } from "../types/site-content";

export type ConsentChoice = "granted" | "denied";

type MetaPixel = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: MetaPixel;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    dataLayer: unknown[];
    fbq?: MetaPixel;
    _fbq?: MetaPixel;
  }
}

const CONSENT_KEY = "cookieConsent";

export function readConsentChoice(): ConsentChoice | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function storeConsentChoice(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Stockage indisponible : la bannière reviendra à la prochaine visite.
  }
}

export function hasTracking(settings: SiteSettings): boolean {
  return Boolean(settings.gtmId || settings.ga4Id || settings.metaPixelId);
}

// GTM et gtag.js exigent l'objet `arguments` lui-même dans dataLayer (un
// tableau ordinaire est ignoré par leur traitement des commandes gtag) :
// d'où une fonction classique, pas une fonction fléchée avec ...rest.
function gtag(..._args: unknown[]): void {
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

export function initConsentMode(): void {
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
}

export function updateConsentMode(granted: { analytics: boolean; ads: boolean }): void {
  gtag("consent", "update", {
    ad_storage: granted.ads ? "granted" : "denied",
    ad_user_data: granted.ads ? "granted" : "denied",
    ad_personalization: granted.ads ? "granted" : "denied",
    analytics_storage: granted.analytics ? "granted" : "denied",
  });
}

const loadedScripts = new Set<string>();

function loadScript(src: string): void {
  if (loadedScripts.has(src)) return;
  loadedScripts.add(src);
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function loadGtm(gtmId: string): void {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  loadScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`);
}

function loadGa4(ga4Id: string): void {
  gtag("js", new Date());
  gtag("config", ga4Id);
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`);
}

function loadMetaPixel(pixelId: string): void {
  if (!window.fbq) {
    const fbq = function (this: unknown) {
      // eslint-disable-next-line prefer-rest-params
      const args = arguments;
      if (fbq.callMethod) fbq.callMethod(...Array.from(args));
      else fbq.queue.push(args);
    } as MetaPixel;
    fbq.queue = [];
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;
    loadScript("https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", pixelId);
    fbq("track", "PageView");
  }
}

/** Dernière page vue envoyée : chemin et identifiants de suivi (voir injectTrackingIfConsented). */
let lastPageView: string | null = null;

/**
 * Point d'entrée appelé par <SiteHead> (à chaque page) et par useConsent()
 * (au clic sur Accepter). Sans consentement, ne fait rien. Avec GTM, GA4 et
 * le Pixel se pilotent depuis l'interface GTM (des tags, pas du code ici) :
 * il suffit que leurs identifiants existent dans les réglages du site pour
 * être configurés côté GTM par Booster. Sans GTM, GA4 et le Pixel sont
 * chargés directement.
 *
 * Une page vue par page : <SiteHead> rappelle cette fonction à chaque nouvel
 * objet `settings` (instantané de build, puis cache, puis réponse de l'API,
 * avec les mêmes identifiants). gtm.js n'est poussé et gtag("config") n'est
 * appelé qu'une fois pour un même chemin et un même jeu d'identifiants
 * (gtmId, ga4Id, metaPixelId) ; changer de page en envoie une nouvelle,
 * revenir sur une page déjà vue aussi. Un appel sans consentement ne compte
 * pas : le clic sur Accepter envoie la page courante.
 */
export function injectTrackingIfConsented(settings: SiteSettings, pathname: string): void {
  if (readConsentChoice() !== "granted") return;
  const pageView = [pathname, settings.gtmId ?? "", settings.ga4Id ?? "", settings.metaPixelId ?? ""].join(" ");
  if (pageView === lastPageView) return;
  lastPageView = pageView;
  if (settings.gtmId) {
    loadGtm(settings.gtmId);
    return;
  }
  if (settings.ga4Id) loadGa4(settings.ga4Id);
  if (settings.metaPixelId) loadMetaPixel(settings.metaPixelId);
}
