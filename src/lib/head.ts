// src/lib/head.ts
//
// Balises de <head> (titre, meta, canonique, JSON-LD), une seule source de
// vérité : les composants (SiteHead, StructuredData) les déclarent avec
// useHead(), et la même déclaration sert aux deux mondes.
// - Au prérendu (src/entry-server.tsx), un collecteur, fourni par
//   HeadCollectorContext, les enregistre pendant renderToString ; le script
//   scripts/prerender.mjs écrit renderHeadTags() dans le <head> du HTML.
// - Dans le navigateur (pas de collecteur), un effet les pose ou les
//   remplace dans document.head (applyHeadTags), à chaque changement.
//
// Chaque balise a une identité (une seule par identité dans <head>) : la
// dernière déclaration l'emporte. Une valeur absente (undefined) retire la
// balise du document et ne s'écrit pas au prérendu.
import { createContext, useContext, useEffect } from "react";

export type HeadTag =
  | { kind: "title"; text: string }
  | { kind: "meta"; attribute: "name" | "property"; key: string; content: string | undefined }
  | { kind: "canonical"; href: string | undefined }
  | { kind: "json-ld"; id: string; json: string | undefined };

/** Balise `<meta name|property="key" content="...">`. */
export function metaTag(attribute: "name" | "property", key: string, content: string | undefined): HeadTag {
  return { kind: "meta", attribute, key, content };
}

/** Collecteur du rendu serveur : `collect` pour HeadCollectorContext, `tags` une fois le rendu fini. */
export type HeadCollector = { collect: (tags: HeadTag[]) => void; tags: () => HeadTag[] };

/** Fourni par src/entry-server.tsx seulement : null dans le navigateur. */
export const HeadCollectorContext = createContext<((tags: HeadTag[]) => void) | null>(null);

function identity(tag: HeadTag): string {
  switch (tag.kind) {
    case "title":
      return "title";
    case "meta":
      return `meta:${tag.attribute}:${tag.key}`;
    case "canonical":
      return "canonical";
    case "json-ld":
      return `json-ld:${tag.id}`;
  }
}

export function createHeadCollector(): HeadCollector {
  // Map : une déclaration plus tardive remplace la valeur sans changer l'ordre.
  const byIdentity = new Map<string, HeadTag>();
  return {
    collect: (tags) => {
      for (const tag of tags) byIdentity.set(identity(tag), tag);
    },
    tags: () => [...byIdentity.values()],
  };
}

/**
 * Déclare des balises de tête. Rendu serveur : les donne au collecteur,
 * pendant le rendu (les effets n'y tournent pas). Navigateur : les pose dans
 * document.head après le rendu, puis à chaque changement de valeur.
 */
export function useHead(tags: HeadTag[]): void {
  const collect = useContext(HeadCollectorContext);
  collect?.(tags);
  // Dépendance par valeur : le tableau est recréé à chaque rendu.
  const signature = JSON.stringify(tags);
  useEffect(() => {
    applyHeadTags(JSON.parse(signature) as HeadTag[]);
  }, [signature]);
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => HTML_ESCAPES[char]);
}

/**
 * Balises collectées en HTML, une par ligne, pour le <head> d'une page
 * prérendue. Dans un JSON-LD, `<` devient `\u003c` (même valeur une fois le
 * JSON lu) : aucun texte saisi dans Lea CRM ne peut fermer la balise.
 */
export function renderHeadTags(tags: HeadTag[]): string {
  const lines: string[] = [];
  for (const tag of tags) {
    switch (tag.kind) {
      case "title":
        lines.push(`<title>${escapeHtml(tag.text)}</title>`);
        break;
      case "meta":
        if (tag.content !== undefined) lines.push(`<meta ${tag.attribute}="${escapeHtml(tag.key)}" content="${escapeHtml(tag.content)}">`);
        break;
      case "canonical":
        if (tag.href !== undefined) lines.push(`<link rel="canonical" href="${escapeHtml(tag.href)}">`);
        break;
      case "json-ld":
        if (tag.json !== undefined) {
          lines.push(`<script type="application/ld+json" id="${escapeHtml(tag.id)}">${tag.json.replace(/</g, "\\u003c")}</script>`);
        }
        break;
    }
  }
  return lines.join("\n");
}

function setMeta(attribute: "name" | "property", key: string, content: string | undefined): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (content === undefined) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string | undefined): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (href === undefined) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(id: string, json: string | undefined): void {
  let el = document.getElementById(id);
  if (json === undefined) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.setAttribute("type", "application/ld+json");
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = json;
}

/**
 * Pose, remplace ou retire les balises dans document.head (navigateur
 * seulement). Une page prérendue les a déjà : elles sont mises à jour sur
 * place, jamais dupliquées.
 */
export function applyHeadTags(tags: HeadTag[]): void {
  for (const tag of tags) {
    switch (tag.kind) {
      case "title":
        document.title = tag.text;
        break;
      case "meta":
        setMeta(tag.attribute, tag.key, tag.content);
        break;
      case "canonical":
        setCanonical(tag.href);
        break;
      case "json-ld":
        setJsonLd(tag.id, tag.json);
        break;
    }
  }
}
