# booster-site-starter

Gabarit des sites vitrines de Booster Agency : Vite + React + Tailwind, un
dépôt par client (copie de ce gabarit), textes et images éditables lus à
l'exécution depuis l'API publique de Lea CRM (module « Mon site »). Le client
modifie ses textes, ses photos et ses articles depuis Lea CRM ; le site les
affiche, sans FTP ni redéploiement manuel.

Deux étages, pour ne jamais afficher une page blanche :

1. Au build, `scripts/fetch-content.mjs` récupère le contenu publié et
   l'écrit dans `src/content.snapshot.json` (les corps des articles à part,
   dans `src/content.articles.snapshot.json`), puis chaque page du site est
   prérendue en HTML complet (voir « Prérendu ») : le site s'affiche tout de
   suite, titre et balises de partage compris, sans attendre le JavaScript
   ni aucun appel réseau.
2. Dans le navigateur, React reprend la page affichée (hydratation), puis
   `useSiteContent()` relance un appel à l'API et remplace le contenu
   affiché par la version fraîche. Si cet appel échoue (API indisponible,
   CORS refusé, réseau coupé), le site reste sur le dernier contenu connu.

Le schéma du site (quelles sections, quels champs) est fixé par Claude Code
dans `site.schema.json`, à la fois ici et côté CRM. Le client édite des
valeurs, jamais la structure. Les consignes d'écriture pour un nouveau site
sont dans `CLAUDE.md`.

## Prérequis

- Node 20.12 ou plus récent (24 conseillé, voir `.nvmrc`).
- Un site déjà créé côté Lea CRM (`npm run site:provision`, voir plus bas) :
  le pré-build a besoin d'un vrai jeton public (43 caractères). Un jeton
  absent ou faux donne un 404 générique, indiscernable d'un site inexistant.

## Démarrer un nouveau site

Un nouveau site se démarre depuis le dépôt Lea CRM, en une commande.
Remplacer chaque `<...>` par la vraie valeur du client : une valeur
d'exemple (« Nom du client », une adresse ou un domaine en `exemple` ou
`example`) est refusée.

```bash
npm run site:new -- --slug=<slug> --name="<nom du client>" --owner-email=<adresse du propriétaire> --dry-run
npm run site:new -- --slug=<slug> --name="<nom du client>" --owner-email=<adresse du propriétaire> [--domain=<domaine définitif>]
```

La commande crée le dépôt privé `ilan-cmykuyi/site-<slug>` depuis ce
modèle, le clone en HTTPS dans `/Users/ilan/sites/<slug>` et installe les
dépendances, remplit le bloc `site` de `site.schema.json` (nom, slug
`principal`, domaines : le domaine définitif s'il est donné, puis
`site-<slug>.pages.dev` ; deux lignes changées, le reste du fichier
intact), branche le site en production (tenant, site, contenu de départ
`content.seed.json`), écrit `.env`, lance `npm run build`, commite
« Configuration initiale du site » et pousse, puis crée le projet
Cloudflare Pages (hook de déploiement, alerte, mise en ligne sur
`https://site-<slug>.pages.dev/`, ou le sous-domaine attribué par
Cloudflare, donné par le bilan de `site:new`). Son bilan donne l'adresse du site,
l'identifiant de connexion du client et, une seule fois, son mot de passe.
Relancée après un échec, elle reprend là où elle s'était arrêtée ;
`--dry-run` imprime le plan sans rien écrire. Détails et prérequis
(compte `gh` actif `ilan-cmykuyi`, `railway link`, jeton Cloudflare) :
`docs/sites/README.md` du dépôt CRM, « Créer un site en une commande ».

Ensuite, dans `/Users/ilan/sites/<slug>` :

1. Briefer Claude Code : le métier du client, les sections voulues, le ton.
   Il lit `CLAUDE.md`, écrit les composants dans `src/sections/`, déclare les
   sections dans `site.schema.json` et leurs valeurs de départ dans
   `content.seed.json`.
2. `npm run check` : typage, ESLint (aucun texte en dur dans un composant),
   cohérence entre les composants et `site.schema.json`, et tests.
3. `npm run dev` pour travailler, `npm run build` puis `npm run preview` pour
   vérifier le résultat construit.
4. Brancher les sections nouvelles côté CRM en relançant
   `npm run site:provision:prod` (voir « Branchement côté CRM »), puis
   commit et push : Cloudflare Pages reconstruit le site.
5. Le contenu réel du client (textes, images, coordonnées, mentions légales)
   se saisit dans Lea CRM : le site part des valeurs d'exemple de
   `content.seed.json`, et une relance du branchement ne remplace jamais une
   valeur déjà en base.
6. Le DNS du domaine définitif (voir « DNS »).

Sans la commande, à la main : « Use this template » sur GitHub, clone,
`npm install`, `.env` copié de `.env.example` avec le jeton public du site
(imprimé par `npm run site:provision` côté CRM, ou visible dans Lea CRM,
Réglages du site > Jetons d'accès ; `.env` n'est jamais commité), puis
« Branchement côté CRM » et « Déploiement ».

Exemple prêt à l'emploi : le site de démonstration Booster, jeton public
`taqhIyF5qe3bWN6bKy0MRuyIwc9KUzGXpeFHog_rBPY` (lecture seule, contenu de
démonstration). Collé dans `.env`, il fait tourner ce dépôt tel quel.

## Scripts npm

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur Vite. `predev` rafraîchit d'abord l'instantané si un jeton est posé (sans réseau ou sans jeton : avertissement, l'instantané existant reste). |
| `npm run fetch-content` | Récupère le contenu publié dans `src/content.snapshot.json`, et les corps des articles dans `src/content.articles.snapshot.json`. |
| `npm run check` | `tsc`, `eslint` (zéro avertissement), `check-schema` et les tests. À passer avant de livrer. |
| `npm run build` | `prebuild` = fetch-content + check-schema, puis `tsc`, `vite build` vers `dist/` et `vite build --ssr` (rendu serveur vers `dist-ssr/`, jamais déployé), puis `postbuild` = une page HTML prérendue par adresse (`scripts/prerender.mjs`, voir « Prérendu »), `dist/sitemap.xml` et `dist/robots.txt` (`scripts/build-sitemap.mjs`). |
| `npm run preview` | Sert `dist/` en local (port 4173). |
| `npm run lint` | ESLint seul. |
| `npm test` | Tests (vitest) : image de partage, données structurées, sitemap, prérendu (pages, injection, article embarqué dans sa page), balises de tête, page d'article, corps des articles (collecte, hors du JavaScript du navigateur), dates. |
| `npm run check-schema` | Vérifie que chaque clé lue par un composant existe dans `site.schema.json`. |

## Le contenu, en détail

### Sections du gabarit

- `hero` et `testimonials` : exemples de sections propres au client, à
  adapter ou remplacer (`src/sections/`).
- Sections standard, gardées par tout site : `nav` (libellés du menu, nom
  affiché), `footer` (présentation, coordonnées, horaires, réseaux sociaux,
  copyright, lien vers les mentions légales) et `legal` (identité de
  l'entreprise, hébergeur, mentions légales et politique de confidentialité,
  rendues sur `/mentions-legales`), éditables depuis Lea CRM ; le nombre de
  pages reste fixé par le code.

### L'instantané commité

`src/content.snapshot.json` est commité, pas ignoré : Cloudflare Pages part
d'un checkout propre à chaque build, c'est la seule façon de « garder le
snapshot précédent » quand l'API ne répond pas. Le fichier livré avec ce
gabarit est l'instantané du site de démonstration (toutes les sections du
schéma), pour que `npm run dev` fonctionne sans réseau ni jeton. Dès le
premier `npm run build` (ou `npm run fetch-content`) avec un jeton, il est
remplacé par le contenu réel du site : commiter cette nouvelle version.

`GET /content` ne renvoie que des résumés d'articles : le pré-build range le
corps de chacun (`bodyHtml`, un appel à `GET /articles/:slug` par article,
quatre à la fois au plus) dans un second fichier commité,
`src/content.articles.snapshot.json`, pour prérendre les pages d'articles
complètes. `src/content.snapshot.json` n'a jamais de corps : il est dans le
JavaScript de chaque page, et cinquante articles y ajouteraient des
centaines de kilo-octets. Seul le rendu serveur importe les corps
(`src/entry-server.tsx`, une règle ESLint l'interdit ailleurs dans `src/`,
comme d'y importer `src/entry-server.tsx`) ; chaque page d'article porte le
sien (voir « Prérendu »). Mêmes règles de repli que l'instantané : API
injoignable, les deux fichiers précédents restent ; corps d'un article illisible
(avertissement dans le journal), celui du build précédent reste, et un
article nouveau est prérendu avec son titre, sa description et sa
canonique, son corps arrivant par l'API dans le navigateur (un message
d'indisponibilité en cas de panne, jamais une page vide). Dans le
navigateur, la page d'un article part de l'article embarqué puis le remplace
par la réponse de l'API ; si l'API est injoignable, il reste affiché ; si
elle répond 404 (article dépublié depuis le build), un message le remplace
et la page passe en `noindex`.

### Pourquoi l'ancien texte peut apparaître brièvement

Chaque page arrive avec le contenu du dernier build (HTML prérendu, tiré de
`src/content.snapshot.json`). Deux sources peuvent ensuite le remplacer dans
le navigateur. D'abord le cache (`localStorage`, le dernier contenu affiché
avec succès sur ce poste), juste après le chargement, mais seulement s'il
tient une publication plus récente que celle de la page (`isCacheNewer`,
`src/lib/content-cache.ts`) : un cache plus ancien ou de la même
publication est ignoré, une page arrivée à jour n'est jamais remplacée par
l'ancien texte. Ensuite l'API de Lea CRM, dont la réponse remplace
l'affichage dès qu'elle arrive et devient la nouvelle valeur du cache. Une
section absente du cache (ajoutée au schéma depuis la dernière visite) est
reprise de l'instantané, pour ne jamais afficher un menu vide.

Après un clic sur « Publier le site » dans Lea CRM, l'API sert le nouveau
contenu tout de suite, mais le site déployé (Cloudflare Pages) met de
l'ordre d'une minute à se reconstruire. Pendant ce délai, un visiteur dont
le cache tient déjà cette publication (la personne qui vient de publier, a
vu le nouveau texte et recharge la page) ne voit jamais l'ancien texte : le
script anti-clignotement masque la page le temps d'afficher ce cache (voir
« Prérendu »). Une fois le site reconstruit, la page arrive à jour pour
tous. Restent trois cas où un ancien texte apparaît le temps que l'API
réponde, et toute la visite si elle est injoignable :

- pendant la reconstruction, un poste qui n'a pas encore vu cette
  publication : il reçoit le HTML du build précédent (ou son propre cache,
  s'il est plus récent que ce HTML) ;
- un article publié ou dépublié, un article publié modifié ou supprimé, des
  réglages du site ou un texte alternatif d'image modifiés dans Lea CRM : le
  CRM relance aussi le build (même URL de reconstruction, seulement si elle
  est renseignée, au plus une fois toutes les 30 secondes, les demandes
  rapprochées regroupées), mais la page garde le HTML du build précédent
  jusqu'à la fin de la reconstruction (voir « Limites connues ») ;
- un aperçu (`?preview=`) : il part du HTML publié, que le brouillon remplace.

### Aperçu d'un brouillon

Une URL du site déployé avec `?preview=<jeton d'aperçu>` (Lea CRM, Réglages
du site > Jetons d'accès) affiche le brouillon au lieu du publié, avec un
bandeau « Aperçu du brouillon ». Le jeton est aussitôt retiré de l'adresse
et gardé dans `sessionStorage` (portée à l'onglet) : il ne part ni dans GA4,
ni dans les journaux du CDN, ni dans l'historique. Un jeton faux donne un 404
et le site reste sur le contenu affiché : un aperçu qui ne montre « rien de
neuf » est le signe d'un mauvais jeton, pas d'une absence de brouillon. Ce
jeton est un secret : jamais dans le dépôt, jamais dans `.env`.

### Formulaire de contact

`src/components/ContactForm.tsx` envoie `POST /forms` ; le message devient un
prospect dans Lea CRM. Pot de miel `website`, au moins un e-mail ou un
téléphone, 5 envois par minute et par IP, 50 par jour et par site (429 avec
`Retry-After`, affiché). Le formulaire se masque si Réglages > Formulaire de
contact est désactivé, ou si l'API répond 404.

### Suivi et consentement

`gtmId`, `ga4Id` et `metaPixelId` viennent des réglages du site. Rien n'est
chargé sans consentement : `src/lib/tracking.ts` initialise Consent Mode v2
(tout refusé) au démarrage, et une bannière minimale
(`src/components/ConsentBanner.tsx`, hook `useConsent()`) ne s'affiche que si
le site a au moins un identifiant de suivi. Avec GTM, GA4 et le Pixel se
configurent dans GTM ; sans GTM, ils sont chargés directement. Une page vue
par page : `<SiteHead>` ne l'envoie qu'une fois le jeton d'aperçu retiré de
l'adresse (jamais de `?preview=` dans les rapports), et une seule fois par
chemin et jeu d'identifiants, même quand le contenu est rafraîchi. Pour une
bannière complète (tarteaucitron ou équivalent), brancher ses callbacks sur
`updateConsentMode()` et `injectTrackingIfConsented(settings, chemin)`.

### Référencement

- `<SiteHead>`, sur chaque page : titre, description, balises Open Graph
  et `<link rel="canonical">`. L'image de partage est celle de la page
  (cover d'un article), sinon celle du site (Lea CRM, Réglages du site >
  Référencement > Image de partage) ; l'accueil prend à défaut la photo du
  bandeau.
- `src/components/StructuredData.tsx`, rendu par `Layout` : un JSON-LD
  `LocalBusiness` (nom, raison sociale, téléphone, e-mail, adresse, réseaux
  sociaux, image de partage) tiré des sections `nav`, `footer` et `legal`
  par `src/lib/structured-data.ts`. L'adresse du pied de page est découpée
  en rue, code postal et ville quand sa dernière ligne a la forme
  « 75001 Paris ».
- Au post-build, `scripts/build-sitemap.mjs` écrit `dist/sitemap.xml`
  (accueil, blog, chaque article, mentions légales) et un `dist/robots.txt`
  qui y renvoie ; `public/robots.txt` reste le repli.
- Toute image de contenu se rend avec `<ResponsiveImage>`
  (`src/components/ResponsiveImage.tsx`) : elle pose `srcset` et `sizes` dès
  que l'API renvoie des variantes WebP (`PublicImage.srcset`), et seulement
  un `src` sinon, comme aujourd'hui en production.

Toutes ces balises sont écrites dans le HTML prérendu de chaque page (voir
« Prérendu ») : les robots qui n'exécutent pas de JavaScript les lisent.

Canonique, sitemap et adresse du JSON-LD partent du **premier domaine** du
site (voir « Branchement côté CRM »). Sans domaine : pas de canonique (ni
`og:url` dans le HTML prérendu), et le build n'écrit pas de sitemap
(avertissement).

## Prérendu

`npm run build` écrit dans `dist/` une page HTML complète par adresse du
site : contenu, titre, balises `<meta>` (description, Open Graph),
canonique et JSON-LD, lisibles sans JavaScript par les moteurs de recherche
et par les robots de partage (WhatsApp, Facebook, LinkedIn, X).

- **Comment** : `vite build --ssr src/entry-server.tsx` compile le rendu
  serveur dans `dist-ssr/` (jamais déployé), puis `scripts/prerender.mjs`
  rend chaque adresse (`renderToString`, même arbre que dans le navigateur,
  à partir de l'instantané) dans le gabarit `dist/index.html`. Les balises de
  tête sont déclarées une seule fois, par `<SiteHead>` et `<StructuredData>`
  (`useHead`, `src/lib/head.ts`) : collectées au prérendu, tenues à jour
  dans le navigateur.
- **Deux instantanés** : le contenu (`src/content.snapshot.json`, résumés
  des articles compris) sert au prérendu et au navigateur ; les corps des
  articles (`src/content.articles.snapshot.json`) au prérendu seulement :
  seul `src/entry-server.tsx` les importe, ils ne sont jamais dans le
  JavaScript du site.
- **Pages d'articles** : l'article et son corps (`prerenderedArticle`) sont
  passés au rendu serveur (`render(url, { article })`), puis écrits dans la
  page, `<script type="application/json" id="prerender-article">` juste
  après `#root` (`<` y devient `\u003c`, comme dans le JSON-LD).
  `src/main.tsx` lit ce script une fois, avant l'hydratation
  (`readPrerenderedArticle`, `src/lib/prerendered-article.ts`), et passe
  l'article à `SiteContentProvider` (`initialArticle`), la même prop que le
  serveur : le premier rendu reproduit le HTML. Arrivé sur un article par
  un lien du site, le navigateur n'a pas son corps : chargement, puis
  l'API. Un article dont le corps a manqué au build est prérendu avec son
  titre, sa description et sa canonique, tirés de son résumé.
- **Quelles pages** : `prerenderPages` (`scripts/lib/prerender.mjs`) : `/`
  dans `index.html`, `/blog` dans `blog.html`, chaque article dans
  `blog/<slug>.html`, `/mentions-legales` dans `mentions-legales.html` (si
  la section `legal` existe) et la page 404 dans `404.html`. Des fichiers
  `.html` plats : Cloudflare Pages sert `/blog` depuis `blog.html` et
  redirige `/blog/` vers `/blog`, l'adresse de la canonique.
- **Dans le navigateur** : React reprend la page (hydratation,
  `src/main.tsx`) quand elle a été prérendue pour l'adresse visitée
  (`<html data-prerender="/blog">`). Son premier rendu part de l'instantané,
  exactement comme le prérendu ; le cache, le jeton d'aperçu et le choix de
  consentement ne sont lus qu'ensuite (`useBrowserValue`), puis l'API
  rafraîchit le contenu comme avant.
- **La page 404** : `404.html` (rendu de `src/pages/NotFound.tsx`,
  `<html data-prerender="404">`) est servie avec le code 404 pour toute
  adresse sans fichier. Elle n'est pas hydratée : le routeur du navigateur y
  affiche la vraie page si elle existe, par exemple un article publié depuis
  le dernier build.
- **Anti-clignotement** : chaque page porte `data-published-at` (la
  publication figée dans l'instantané) et `data-public-token` (le jeton
  public, déjà présent dans le bundle). Un script inline en tête
  d'`index.html`, exécuté avant tout affichage, compare cette date à celle du
  cache du navigateur (`lea-site-content:v1:<jeton>`) : si le cache est plus
  récent, `#root` reste masqué (classe `content-stale`, `src/index.css`)
  jusqu'à ce que `SiteContentProvider` l'affiche, et 3 s au plus si le
  JavaScript du site ne démarre pas.

## CORS et développement local

L'API n'accepte les appels du navigateur que depuis une origine listée dans
les domaines du site (Lea CRM, Réglages du site > Domaines), en `https`. En
production, `localhost` est refusé : c'est voulu.

Conséquence, en local (`npm run dev`, `npm run preview`) avec `.env` pointant
sur `https://app.leacrm.com` :

- le premier rendu est correct, il vient de `src/content.snapshot.json`
  (récupéré côté Node par le pré-build, qui n'est pas soumis à CORS) ;
- le rafraîchissement en direct, l'envoi du formulaire et la page d'un
  article échouent en silence (erreur CORS dans la console du navigateur,
  message « Une erreur est survenue » sous le formulaire, message
  d'indisponibilité sur l'article). Le site reste sur l'instantané. Le
  corps d'un article n'est que dans sa page prérendue : pour le voir sans
  l'API, `npm run build` puis `npm run preview`. Aucun message n'arrive au CRM : la requête POST est bloquée
  avant même de partir (échec de la pré-vérification `OPTIONS`).

Ce comportement est le comportement attendu : ne pas le contourner. Pour
tester le formulaire ou un article de bout en bout, déployer sur Cloudflare
Pages (l'origine `*.pages.dev` du projet doit alors figurer dans les domaines
du site côté CRM) ou pointer `VITE_SITE_API_BASE` vers un CRM lancé en local
(`npm run dev` côté CRM, où `localhost` est accepté).

## Branchement côté CRM

Dans le dépôt Lea CRM :

```bash
npm run site:provision -- \
  --tenant=<slug-client> --create-tenant --name="<Nom du client>" --owner-email=<email> \
  --schema=<chemin>/site.schema.json \
  --seed=<chemin>/content.seed.json \
  --site-slug=principal \
  --domains=<domaine.fr>,www.<domaine.fr>
```

Le script crée le tenant, le site et son contenu de départ, et imprime les
jetons public et d'aperçu. `site.schema.json` est le même fichier que celui
de ce dépôt (copié tel quel). Réexécuter la commande après un ajout de
section met le schéma à jour sans écraser ce que le client a déjà édité ;
une section nouvelle est créée déjà publiée, avec les valeurs du seed.
Documentation complète : `docs/sites/README.md` du dépôt CRM.

Deux réglages à ne pas oublier dans Lea CRM, Réglages du site :

- **Domaines** : chaque origine qui appelle l'API (`exemple.fr`,
  `www.exemple.fr`, et le `<projet>.pages.dev` tant qu'il sert de test).
  Sans cela, le site s'affiche mais ne se rafraîchit pas et le formulaire ne
  part pas (CORS). Le premier de la liste est l'adresse de référence du site
  (canonique, sitemap, données structurées) : dès qu'il existe, le domaine
  définitif du client, pas le `<projet>.pages.dev` de test.
- **Déploiement > URL de reconstruction** : le deploy hook Cloudflare Pages
  (section suivante). Le CRM appelle cette URL après chaque « Publier le
  site », et aussi quand un article est publié ou dépublié, quand un article
  publié est modifié ou supprimé, ou quand les réglages du site ou le texte
  alternatif d'une image changent (au plus une reconstruction toutes les
  30 secondes par site, les demandes rapprochées regroupées). Chaque appel
  relance le build, qui regénère l'instantané avec le contenu en ligne. Sans
  cette URL, rien n'est reconstruit automatiquement.

Après une régénération du jeton public (Réglages > Jetons d'accès), l'ancien
cesse de répondre immédiatement : mettre à jour la variable de build et
relancer un déploiement.

## Déploiement

### Cloudflare Pages

1. Connecter le dépôt GitHub à Cloudflare Pages.
2. Build command : `npm run build`. Build output directory : `dist`.
3. Variables d'environnement (Réglages > Variables et secrets) :
   `VITE_SITE_API_BASE` et `VITE_SITE_PUBLIC_TOKEN` (les mêmes que `.env`),
   plus `NODE_VERSION=24` si le projet n'honore pas `.nvmrc`.
4. Deploy hook : Réglages > Builds et déploiements > Deploy hooks, en créer
   un. Coller son URL dans Lea CRM, Réglages du site > Déploiement > URL de
   reconstruction du site.
5. Domaine personnalisé : Custom domains, ajouter le domaine du client. Ce
   domaine doit AUSSI être ajouté dans Lea CRM, Réglages du site > Domaines
   (les deux listes sont indépendantes).

Rien à configurer pour les adresses : Cloudflare Pages sert chaque page
prérendue (`/blog` depuis `blog.html`, `/blog/mon-article` depuis
`blog/mon-article.html`), redirige `/blog/` vers `/blog`, et sert
`404.html` avec le code 404 pour toute autre adresse (voir « Prérendu »).

### Alternative : FTP OVH

1. `npm run build` produit `dist/`.
2. Transférer le contenu de `dist/` vers le dossier `www` de l'hébergement
   OVH (FileZilla).
3. `public/.htaccess` (copié dans `dist/` à chaque build) fait comme
   Cloudflare Pages : `/blog` servi par `blog.html`, `/blog/` redirigé vers
   `/blog`, `404.html` avec le code 404 pour toute autre adresse. Il suppose
   le site à la racine du domaine et un Apache qui accepte `DirectorySlash`,
   `ErrorDocument` et `mod_rewrite` dans un `.htaccess`.
4. Pas de deploy hook dans ce circuit : après une publication depuis Lea CRM,
   relancer `npm run build` puis retransférer `dist/`.

### DNS

Domaine acheté chez OVH au nom du client, DNS géré chez Cloudflare : changer
les serveurs de noms côté OVH vers ceux donnés par Cloudflare, puis gérer les
enregistrements depuis Cloudflare.

- Vers Cloudflare Pages : l'enregistrement `CNAME` proposé par Pages à l'ajout
  du domaine personnalisé. HTTPS automatique.
- Vers l'hébergement OVH (circuit FTP) : `A` ou `CNAME` vers le serveur OVH.
  HTTPS fourni par OVH, sauf proxy Cloudflare (nuage orange) devant.

## Limites connues

- **Articles et reconstruction.** Le CRM relance le build (URL de
  reconstruction) après « Publier le site », et quand un article est publié
  ou dépublié, quand un article publié est modifié ou supprimé, ou quand les
  réglages ou le texte alternatif d'une image changent, par tranches de
  30 secondes, et seulement si l'URL de reconstruction est renseignée.
  Jusqu'à la fin de cette reconstruction (une minute environ), un article
  publié depuis n'a pas de page prérendue (Cloudflare Pages répond 404, le
  JavaScript affiche l'article quand même), un article modifié garde son
  ancienne version dans le HTML (le JavaScript affiche la nouvelle) et un
  article dépublié garde sa page HTML (le JavaScript la remplace par un
  message).
- **Monolingue.** Un site = une langue. Plusieurs langues = plusieurs sites
  côté CRM.
- **Aperçu intégré au CRM : dans un cadre, depuis Lea CRM seulement.**
  L'éditeur de section de Lea CRM affiche le brouillon du site dans un
  iframe (URL du site déployé avec `?preview=`), sur la page que la section
  déclare en `previewPath` dans `site.schema.json` (`/` par défaut,
  `/mentions-legales` pour `legal`). `public/_headers` n'autorise cet
  encadrement qu'au site lui-même et à `https://app.leacrm.com`
  (`frame-ancestors`) : aucun autre site ne peut l'afficher dans un cadre
  (clickjacking). Ce fichier n'est lu que par Cloudflare Pages : sur
  l'hébergement OVH (FTP), cet en-tête n'est pas posé.

## Arborescence

```
booster-site-starter/
├── index.html                 point d'entrée Vite (lang="fr", <div id="root">, script anti-clignotement), gabarit du prérendu
├── site.config.ts             URL de l'API et jeton public (variables VITE_*)
├── site.schema.json           sections et champs que les composants ont le droit de lire
├── content.seed.json          valeurs de départ des sections (--seed de npm run site:provision)
├── .env.example               modèle de .env (jamais commité)
├── CLAUDE.md                  consignes pour Claude Code sur un site dérivé
├── eslint.config.js           dont i18next/no-literal-string sur src/**/*.tsx
├── scripts/
│   ├── fetch-content.mjs      pré-build : contenu publié -> src/content.snapshot.json, corps des articles -> src/content.articles.snapshot.json
│   ├── check-schema.mjs       clés lues par les composants vs site.schema.json
│   ├── prerender.mjs          post-build : une page HTML prérendue par adresse (dist/*.html, dist/404.html)
│   ├── build-sitemap.mjs      post-build : dist/sitemap.xml et dist/robots.txt
│   └── lib/                   sitemap.mjs (pages du sitemap, robots.txt), prerender.mjs (pages prérendues, injection dans le gabarit, article embarqué), article-bodies.mjs (corps des articles) et leurs tests
├── public/
│   ├── _headers               en-têtes Cloudflare Pages (frame-ancestors : aperçu intégré de Lea CRM)
│   ├── .htaccess              réécriture Apache (FTP OVH uniquement) : pages prérendues, 404
│   ├── favicon.svg, robots.txt (repli sans domaine)
└── src/
    ├── main.tsx, App.tsx      hydratation ou rendu ; routes /, /blog, /blog/:slug, /mentions-legales, 404
    ├── entry-server.tsx       rendu serveur d'une adresse, pour le prérendu (vite build --ssr) ; seul à importer les corps des articles
    ├── index.css              Tailwind v4 (+ plugin typography pour le corps des articles)
    ├── ui-strings.ts          SEUL texte autorisé hors contenu (français)
    ├── content.snapshot.json  instantané du contenu publié, commité
    ├── content.articles.snapshot.json  corps des articles, commité, importé par entry-server.tsx seulement
    ├── types/                 site-content.ts (API publique), standard-sections.ts (nav, footer, legal)
    ├── lib/                   api.ts (appels), preview.ts (jeton d'aperçu), content-cache.ts (cache localStorage du dernier contenu), snapshot.ts (instantané), head.ts (balises de tête, prérendu et navigateur), prerendered-article.ts (article embarqué dans sa page), article-view.ts (page d'article), tracking.ts, format.ts, seo.ts (adresse et image de partage), structured-data.ts (JSON-LD), tests *.test.ts(x)
    ├── hooks/                 useSiteContent, SiteContentProvider, useSection/useSiteMeta/useFullSiteContent, useConsent, useBrowserValue (lecture du navigateur après l'hydratation)
    ├── components/            SiteHead, StructuredData (JSON-LD), ContactForm, ConsentBanner, Layout, Nav (section nav), Footer (section footer)
    ├── sections/              un composant par section du schéma (Hero, Testimonials)
    └── pages/                 Home (assemble les sections), Blog, BlogPost, Legal (/mentions-legales, section legal), NotFound (404)
```
