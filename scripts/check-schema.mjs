#!/usr/bin/env node
// Échoue le build si un composant lit une clé de section ou de champ absente
// de site.schema.json (renommage, faute de frappe, champ retiré du schéma).
// Analyse textuelle (regex) de src/**/*.{ts,tsx}, volontairement simple : pas
// un analyseur de types. Quatre formes de lecture sont reconnues :
//   1. accès direct :            content.sections.hero.title
//   2. appel chaîné :            useSection("hero").title
//   3. déstructuration (hook) :  const { title } = useSection("hero")
//   4. déstructuration directe : const { title } = content.sections.hero
// Limites assumées : une section rangée dans une variable puis relue plus
// loin lui échappe (convention : toujours déstructurer ou chaîner au point
// d'appel) ; les sous-champs d'un champ `list` (item.quote) ne sont pas
// vérifiés ; un motif dans un commentaire serait compté à tort.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const SCHEMA_PATH = join(ROOT, "site.schema.json");
const SRC_DIR = join(ROOT, "src");

let schema;
try {
  schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
} catch (err) {
  console.error(`[check-schema] site.schema.json illisible : ${err.message}`);
  process.exit(1);
}
if (!Array.isArray(schema.sections) || schema.sections.length === 0) {
  console.error("[check-schema] site.schema.json ne déclare aucune section (clé `sections`).");
  process.exit(1);
}

// "sectionKey.fieldKey" pour les champs de premier niveau de chaque section.
const validKeys = new Set();
for (const section of schema.sections) {
  for (const field of section.fields ?? []) validKeys.add(`${section.key}.${field.key}`);
}

function parseDestructuredFields(raw) {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.split(":")[0].split("=")[0].trim())
    .filter((name) => /^[a-zA-Z_]\w*$/.test(name));
}

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

function checkFile(path, text, errors) {
  const shown = relative(ROOT, path);
  const record = (sectionKey, fieldKey, index) => {
    const key = `${sectionKey}.${fieldKey}`;
    if (!validKeys.has(key)) errors.push(`${shown}:${lineOf(text, index)} clé absente de site.schema.json : ${key}`);
  };

  for (const m of text.matchAll(/content\.sections\.([a-zA-Z_]\w*)\.([a-zA-Z_]\w*)/g)) {
    record(m[1], m[2], m.index);
  }
  for (const m of text.matchAll(/useSection(?:<[^)]*>)?\(\s*["'`]([a-zA-Z_]\w*)["'`]\s*\)\.([a-zA-Z_]\w*)/g)) {
    record(m[1], m[2], m.index);
  }
  // `[^{}]` et non `[^}]` : sinon, quand la déstructuration est la première
  // instruction d'une fonction, la correspondance partait de l'accolade de la
  // fonction et avalait celle de la déstructuration ; le premier champ
  // (« const { title ») n'était alors jamais vérifié.
  for (const m of text.matchAll(/\{\s*([^{}]+?)\s*\}\s*=\s*useSection(?:<[^)]*>)?\(\s*["'`]([a-zA-Z_]\w*)["'`]\s*\)/g)) {
    for (const field of parseDestructuredFields(m[1])) record(m[2], field, m.index);
  }
  for (const m of text.matchAll(/\{\s*([^{}]+?)\s*\}\s*=\s*content\.sections\.([a-zA-Z_]\w*)/g)) {
    for (const field of parseDestructuredFields(m[1])) record(m[2], field, m.index);
  }
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules") continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, files);
    else if ([".ts", ".tsx"].includes(extname(name))) files.push(full);
  }
  return files;
}

const files = walk(SRC_DIR);
const errors = [];
for (const file of files) checkFile(file, readFileSync(file, "utf8"), errors);

if (errors.length) {
  console.error("[check-schema] clés absentes du schéma :\n" + errors.map((e) => `  ${e}`).join("\n"));
  process.exit(1);
}
console.log(`[check-schema] OK (${validKeys.size} clés connues, ${files.length} fichiers analysés).`);
