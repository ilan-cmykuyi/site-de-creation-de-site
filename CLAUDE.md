# Consignes pour les sites construits à partir de ce dépôt

Ce dépôt est le gabarit des sites vitrines de Booster Agency : Vite + React +
Tailwind, un dépôt par client (copie de ce gabarit), contenu éditable lu à
l'exécution depuis l'API publique de Lea CRM (module « Mon site »). Lire le
README avant d'écrire le premier composant. Les règles ci-dessous s'appliquent
à tout site dérivé, sans exception.

## Le contenu vient du CRM, jamais du code

- **Tout texte et toute image que le client peut vouloir changer** vient d'une
  section du contenu (`useSection("cle")` dans `src/sections/`) ou des
  métadonnées du site (`useSiteMeta()`). Rien de tel en dur dans le JSX.
- **Le seul texte autorisé hors contenu** est celui de `src/ui-strings.ts`
  (libellés du formulaire, états vides, erreurs, bannière de consentement,
  intitulés fixes du pied de page et des mentions légales), en français. Un
  composant l'importe, il n'écrit jamais une phrase lui-même. La règle ESLint
  `i18next/no-literal-string` (tout `src/**/*.tsx`) refuse le reste : texte
  JSX, `alt`, `placeholder`, `title`, `aria-label`, `value`, et tout prop
  texte d'un composant maison.
- Un site est **monolingue** par construction (un seul jeu de valeurs par
  section). Plusieurs langues = plusieurs sites côté CRM, pas une
  fonctionnalité de ce dépôt.

## Ajouter une section = trois endroits, dans le même commit

1. Le composant, dans `src/sections/<Nom>.tsx`, qui lit sa section avec
   `useSection<Type>("cle")` en déstructurant ou en chaînant **au point
   d'appel** (`const { title } = useSection("hero")`, jamais
   `const hero = useSection("hero")` relu plus loin) : c'est la forme que
   `scripts/check-schema.mjs` sait vérifier. `useFullSiteContent()` est
   réservé aux fonctions de `src/lib/` (un composant le leur passe tel
   quel) ; les composants lisent `useSection("cle")` ou
   `content.sections.cle` pour rester couverts par `scripts/check-schema.mjs`.
2. L'entrée dans `site.schema.json` (clé de section, libellé, champs). Ce
   fichier est le contrat : les composants n'ont le droit de lire que les clés
   qu'il déclare, `npm run check` échoue sinon. Une section affichée sur une
   autre page que l'accueil y déclare aussi son `previewPath` (voir
   « Référencement et aperçu intégré »).
3. Les valeurs de départ dans `content.seed.json`, passé à
   `npm run site:provision` côté CRM (voir « Branchement côté CRM » du
   README), et le composant monté dans `src/pages/Home.tsx` (ou la page
   concernée).

Le client édite des **valeurs** depuis Lea CRM, jamais la structure : pas de
schéma éditable côté client, pas de champ « HTML libre ».

## Menu, pied de page et mentions légales

Chaque site conserve les sections `nav`, `footer` et `legal` ; le nombre de
pages est du code, leurs libellés sont du contenu.

- `nav` (Menu) est lue par `src/components/Nav.tsx`, `footer` (Pied de page)
  par `src/components/Footer.tsx`, `legal` (Mentions légales) par la page
  `/mentions-legales` (`src/pages/Legal.tsx`). Ne pas les retirer du schéma,
  ni renommer leurs clés ou celles de leurs champs.
- Ajouter une page = une route dans `src/App.tsx`, une entrée dans `Nav.tsx`
  et un champ de libellé dans la section `nav` (`<page>Label`, `text`,
  requis, 30 caractères au plus), dans `site.schema.json` comme dans
  `content.seed.json`. Jamais un libellé de page en dur, pas même dans
  `src/ui-strings.ts`. La page s'ajoute aussi au prérendu et au sitemap
  (voir « Prérendu » et « Référencement et aperçu intégré ») et, si une
  section lui est propre, en `previewPath` de cette section.
- Le lien vers `/mentions-legales` reste dans le pied de page de chaque page
  (obligation légale).
- Avant le branchement d'un vrai client, remplacer dans `content.seed.json`
  les valeurs d'exemple de `footer` et `legal` (raison sociale, forme
  juridique, SIRET, directeur de la publication, coordonnées, réseaux
  sociaux, mention de copyright) par les siennes, compléter `legalBody` des
  mentions propres à une société (capital social, immatriculation, numéro de
  TVA intracommunautaire) et adapter `hostingProvider` si le site n'est pas
  servi par Cloudflare Pages.

## Neuf types de champs, pas un de plus

`text`, `textarea`, `richtext`, `image`, `url`, `number`, `boolean`, `select`
(avec `options`), `list` (avec `fields`, sans liste imbriquée). Une `image`
arrive déjà résolue : `{ url, alt, width, height, srcset? } | null`, jamais un
identifiant à résoudre (`srcset` : variantes WebP à largeurs croissantes,
absent tant que l'API n'en envoie pas). Un `richtext` et le corps d'un article
(`bodyHtml`) sont assainis côté CRM (liste blanche de balises) : ce sont les
seuls HTML qu'on injecte tels quels, jamais un HTML d'une autre provenance.

Toute image de contenu (un champ `image`, la cover d'un article) se rend avec
`<ResponsiveImage>` (`src/components/ResponsiveImage.tsx`), jamais un `<img>`
écrit à la main : c'est lui qui pose `srcset`/`sizes` quand l'image en a
(fonction pure `imgAttributes`, `src/lib/images.ts`). Exception : l'image de
partage (`og:image`, `<SiteHead>`) reste `image.url` seul, jamais de
variante.

## Référencement et aperçu intégré

- **Balises de tête** : chaque page rend `<SiteHead>` (titre, description,
  image de partage). L'image se passe en `PublicImage` (un champ `image`,
  la cover d'un article), jamais en URL seule ; sans image propre, la page
  prend celle du site, `settings.seo.ogImage`, déjà résolue par l'API.
  L'accueil passe `siteShareImage()` (`src/lib/seo.ts`) : l'image du site,
  sinon la photo du bandeau. `<SiteHead>` pose aussi la canonique,
  `https://<premier domaine du site><chemin>`. Ces balises (et le JSON-LD)
  se déclarent avec `useHead` (`src/lib/head.ts`), jamais en écrivant dans
  `document.head` : c'est ce qui les met dans le HTML prérendu.
- **Données structurées** : le JSON-LD `LocalBusiness` est construit par
  `buildLocalBusiness` (`src/lib/structured-data.ts`, testé) à partir de
  `nav`, `footer` et `legal`, et posé une seule fois pour tout le site
  par `StructuredData`, que rend `Layout`. Pas de second JSON-LD dans un
  composant.
- **Sitemap** : `buildSitemapXml` (`scripts/lib/sitemap.mjs`) liste les
  pages du site ; le post-build de `npm run build` écrit `dist/sitemap.xml`
  et `dist/robots.txt`. **Toute nouvelle page du site s'y ajoute**, avec son
  cas dans `scripts/lib/sitemap.test.mjs` (et au prérendu, voir ci-dessous).
- **`previewPath`** (`site.schema.json`, par section) : la page que
  l'aperçu intégré de Lea CRM ouvre pour cette section ; `/` par défaut.
  Une section propre à une autre page la déclare, comme `legal` avec
  `"previewPath": "/mentions-legales"`. Le CRM le valide : chemin qui
  commence par `/`, sans query ni ancre.
- **`public/_headers`** (Cloudflare Pages) : `frame-ancestors 'self'
  https://app.leacrm.com`. L'aperçu intégré de Lea CRM affiche le site dans
  un iframe ; aucun autre site ne doit pouvoir l'encadrer (clickjacking).

## Prérendu : rien du navigateur pendant le rendu

Chaque page est prérendue au build en HTML complet (`src/entry-server.tsx`,
`scripts/prerender.mjs`, voir README « Prérendu ») puis reprise par React
dans le navigateur (hydratation) : le premier rendu du navigateur doit
produire exactement le HTML prérendu.

- **Toute nouvelle page = une route** dans `src/App.tsx` **+ une entrée**
  dans `prerenderPages` (`scripts/lib/prerender.mjs`, appelée par
  `scripts/prerender.mjs`) **+ le sitemap** (`buildSitemapXml`), chacun avec
  son cas de test.
- **Aucune lecture de `window`, `document`, `localStorage` ou
  `sessionStorage` pendant le rendu** d'un composant, ni de la date du jour
  ou du fuseau de la machine : dans un effet, ou avec `useBrowserValue`
  (`src/hooks/useBrowserValue.ts`), qui donne la valeur du prérendu au
  premier rendu puis celle du navigateur. Une date affichée passe par
  `formatDate` (`src/lib/format.ts`, fuseau fixé).
- **Les corps des articles ne vont jamais dans le JavaScript du
  navigateur**, que chaque page télécharge : `src/content.articles.snapshot.json`
  n'est importé que par `src/entry-server.tsx`, qui ne s'importe lui-même
  nulle part ailleurs dans `src/` (règle ESLint `no-restricted-imports` ;
  `scripts/lib/article-bodies.test.mjs` vérifie qu'elle tient et qu'aucun
  autre module de `src/`, `src/lib/snapshot.ts` compris, ne charge les
  corps, même par `import()` ou `import.meta.glob`). Une donnée propre à
  une page, nécessaire dès son premier rendu, voyage dans la page elle-même, comme
  l'article (`<script type="application/json">` écrit par `injectPage`) :
  lue UNE fois dans `src/main.tsx` avant l'hydratation et passée par prop
  ou contexte, exactement comme le serveur la passe
  (`render(url, { article })`).
- Après `npm run build`, `dist/` contient une page `.html` par adresse, et la
  console du navigateur (`npm run preview`) ne signale aucune erreur
  d'hydratation.

## Avant de livrer

- `npm run check` (typage, ESLint, cohérence composants/schéma, tests) vert.
- `npm run build` vert avec le vrai jeton du site dans `.env` : le pré-build
  écrit `src/content.snapshot.json` (contenu publié) et
  `src/content.articles.snapshot.json` (corps des articles) ; **ces deux
  fichiers se commitent** (c'est le filet de secours des builds sans
  réseau).
- Vérifier au navigateur (`npm run preview`) : titre, images chargées,
  sections, page `/blog`, formulaire. Après le build, `dist/sitemap.xml`
  liste toutes les pages du site.
- Côté CRM : le site existe (`npm run site:provision`), ses domaines sont
  listés dans Réglages > Domaines (sinon CORS refusé en production ; le
  premier de la liste, domaine définitif du client, fait la canonique et le
  sitemap), l'URL de reconstruction Cloudflare Pages est collée dans
  Réglages > Déploiement. Le CRM l'appelle après « Publier le site », et
  aussi quand un article est publié ou dépublié, quand un article publié
  est modifié ou supprimé, ou quand les réglages du site ou le texte
  alternatif d'une image changent, au plus une fois toutes les 30 secondes
  (demandes rapprochées regroupées) ; sans elle, rien n'est reconstruit
  automatiquement.

## Ne jamais

- Committer `.env` (jeton du site) ni écrire le **jeton d'aperçu** où que ce
  soit dans le dépôt : il se passe dans l'URL (`?preview=...`) et nulle part
  ailleurs.
- Retirer `https://app.leacrm.com` de `frame-ancestors` dans
  `public/_headers` : l'aperçu intégré de Lea CRM afficherait une page
  bloquée.
- Contourner le CORS de l'API (proxy, extension) pour « faire marcher » le
  formulaire ou le rafraîchissement en local : le comportement attendu depuis
  `localhost` vers la production est l'échec silencieux, voir README.
- Écrire un tiret cadratin dans un texte lu par quelqu'un (README, commentaires,
  interface) : deux points, une virgule ou des parenthèses à la place.
