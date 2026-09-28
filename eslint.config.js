// eslint.config.js
import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import i18next from "eslint-plugin-i18next";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "dist-ssr", "node_modules", ".playwright-cli", ".playwright-shots"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    },
  },
  {
    // Corps des articles : src/content.articles.snapshot.json n'est importé que
    // par src/entry-server.tsx (bundle du prérendu, jamais envoyé au
    // navigateur). Importé ailleurs dans src/, il entrerait dans le JavaScript
    // de chaque page ; chaque page d'article porte déjà le sien (README,
    // « Prérendu »). src/entry-server.tsx lui-même ne s'importe nulle part
    // ailleurs dans src/ : il tirerait ces corps et react-dom/server dans le
    // même JavaScript. Vérifié par scripts/lib/article-bodies.test.mjs.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/entry-server.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "(^|/)content\\.articles\\.snapshot\\.json($|\\?)",
              message:
                "Corps des articles réservés au rendu serveur (src/entry-server.tsx) : la page d'un article lit le sien avec usePrerenderedArticle().",
            },
            {
              regex: "(^|/)entry-server(\\.tsx)?$",
              message:
                "src/entry-server.tsx est l'entrée du prérendu (vite build --ssr) : l'importer ailleurs tirerait les corps des articles et react-dom/server dans le JavaScript du navigateur.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["scripts/**/*.mjs", "eslint.config.js"],
    extends: [js.configs.recommended],
    languageOptions: { ecmaVersion: 2023, globals: globals.node },
  },
  {
    // Aucun texte visible en dur dans un composant : tout vient du contenu de
    // Lea CRM (useSection/useSiteMeta) ou de src/ui-strings.ts. Mode jsx-only :
    // texte JSX + attributs porteurs de texte (alt, placeholder, title,
    // aria-label, value sur les balises natives ; tous les props d'un
    // composant maison sauf ceux listés ci-dessous, qui ne sont jamais du
    // texte affiché).
    files: ["src/**/*.tsx"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          mode: "jsx-only",
          "jsx-attributes": {
            exclude: [
              "className", "styleName", "style", "type", "key", "id", "width", "height",
              "to", "path", "href", "rel", "target", "name", "htmlFor", "autoComplete", "role", "loading", "decoding", "end",
              "sizes", "fetchPriority",
            ],
          },
        },
      ],
    },
  },
]);
