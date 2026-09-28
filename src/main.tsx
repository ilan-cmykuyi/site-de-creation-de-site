// src/main.tsx
import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { App } from "./App";
import { SiteContentProvider } from "./hooks/SiteContentProvider";
import { readPrerenderedArticle } from "./lib/prerendered-article";
import { canonicalPath } from "./lib/seo";
import { initConsentMode } from "./lib/tracking";
import "./index.css";

// Consent Mode v2, tout refusé par défaut, AVANT tout chargement de suivi.
initConsentMode();

// Page d'un article : l'article et son corps, écrits dans la page au build
// (script JSON, scripts/lib/prerender.mjs), lus une seule fois, avant tout
// rendu. Le serveur a rendu cette page avec le même article, passé par la
// même prop (render(url, { article }), src/entry-server.tsx). Ailleurs : null.
const initialArticle = readPrerenderedArticle();

const container = document.getElementById("root")!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <SiteContentProvider initialArticle={initialArticle}>
        <App />
      </SiteContentProvider>
    </BrowserRouter>
  </StrictMode>
);

// HTML prérendu pour CETTE adresse (<html data-prerender="/blog">, écrit par
// scripts/prerender.mjs) : React reprend la page affichée (hydratation).
// Sinon, rendu complet :
// - #root vide : serveur de dev (vite), rien n'est prérendu ;
// - page 404 (data-prerender="404"), servie pour toute adresse sans fichier :
//   le routeur y affiche peut-être une vraie page (article publié depuis le
//   dernier build), autre chose que ce HTML ;
// - HTML d'une autre adresse (repli monopage de `vite preview` sur
//   index.html) : l'hydrater produirait un écart.
const prerenderedFor = document.documentElement.dataset.prerender;
if (container.hasChildNodes() && prerenderedFor === canonicalPath(window.location.pathname)) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
