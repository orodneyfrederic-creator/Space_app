# Identité visuelle S'STACK dans le code

Source de la charte : `Documents/S'STACK/Visuel S'STACK/` (copie de référence dans `docs/identite-visuelle/` à la racine du projet).
Slogan : **Cultiver demain avec les données du ciel**.

## Où se trouve chaque élément

| Élément | Fichier | Rôle |
|---|---|---|
| Nom, slogan, couleurs, chemins des logos | `src/lib/marque.ts` | Source unique en TypeScript : importer `MARQUE`, `COULEURS`, `LOGOS` |
| Couleurs en CSS | `src/app/globals.css` | Classes Tailwind (`bg-accent`, `text-ink`, `bg-paper`…) + variables officielles `--ss-*` |
| Logos | `public/brand/` | `logo-principal.png`, `logo-tricolore.png`, `logo-negatif.png`, `icone.png`, `icone-tricolore.png`, `icone-app-192.png`, `icone-app-512.png` |
| Composant logo | `src/components/navigation/Logo.tsx` | `<Logo />` sur fond clair, `<Logo clair />` sur fond sombre |
| Polices | `src/app/fonts/` | Outfit (300 à 800) et JetBrains Mono (400, 700), fichiers officiels de la charte, licence OFL |
| Chargement des polices | `src/app/layout.tsx` | `next/font/local` : aucune dépendance à Google Fonts |
| Favicon et icônes | `src/app/favicon.ico`, `icon.png`, `apple-icon.png` | Onglet du navigateur, écran d'accueil iPhone |
| Image de partage | `src/app/opengraph-image.png`, `twitter-image.png` | Aperçu quand on partage le lien (WhatsApp, LinkedIn, X…) |
| Manifeste | `src/app/manifest.ts` | Nom et couleurs quand le site est ajouté à l'écran d'accueil d'un téléphone |
| Bande tricolore | classe `.bande-tricolore` (globals.css) | La bande vert-jaune-bleu des brand boards (utilisée en haut du pied de page) |

## Le logo

Le symbole est une **feuille aux couleurs du drapeau gabonais** (bandes vert, jaune, bleu de haut en bas, nervures blanches), à gauche des lettres « STACK ». La feuille seule est dans `public/brand/feuille-gabon.png` (fond transparent). Texte alternatif du logo : « S'STACK ».

| Version | Quand l'utiliser | Dans le code |
|---|---|---|
| Principal (feuille + STACK noir) | Fond clair (Pierre de Mbigou, blanc) | `<Logo />` |
| Négatif (feuille + STACK blanc) | Fond sombre (Vert Forêt, Noir Ébène, photo) | `<Logo clair />` |
| Tricolore (feuille + STACK noir, identique au principal) | Fond clair, moments « fierté nationale » (pitch, affiche) | `<Logo variante="tricolore" />` |
| Icône seule | Petits espaces, avatar | `<Logo variante="icone" hauteur={32} />` ou `variante="iconeTricolore"` |

Options : `hauteur` (30 px par défaut), `sousTitre`, `prioritaire` (pour le logo de l'en-tête, chargé en premier).
Ne jamais déformer, recolorer ni redessiner le logo : toujours utiliser les fichiers de `public/brand/`.

## Les couleurs

| Couleur | HEX | Rôle | Classe Tailwind principale |
|---|---|---|---|
| Noir Ébène | `#111A14` | Texte principal, fonds sombres | `text-ink`, `bg-nuit` |
| Vert Forêt | `#0B5D3B` | Couleur principale : en-têtes, boutons, sidebar | `bg-accent`, `bg-vif`, `bg-profond`, `text-cnx` |
| Vert Gabon | `#009E60` | Succès, sol sain, verdict favorable | `text-success`, `bg-success` |
| Jaune Soleil | `#FCD116` | Accent, alertes chaleur | `bg-sun`, `text-pousse` (sur fond sombre seulement) |
| Bleu Océan | `#3A75C4` | Eau, pluie, données NASA | `bg-info`, `text-info` |
| Terre Latérite | `#B4532A` | Sol, érosion, risque | `bg-risk-bar`, `text-risk` |
| Pierre de Mbigou | `#E9E2CF` | Fond des pages, cartes | `bg-paper` ; version éclaircie `bg-pale` |
| Blanc | `#FFFFFF` | Surfaces, texte sur fond sombre | `bg-surface`, `text-white` |

**Règles d'accessibilité (contrastes WCAG, d'après la charte) :**
- Le Jaune Soleil n'est **jamais** du texte sur fond clair (contraste 1,47:1). Il sert d'accent sur Vert Forêt (5,40:1) ou Noir Ébène (12,08:1).
- Texte blanc sur Vert Gabon : seulement pour du grand texte (24 px et plus). Pour les boutons, Vert Forêt (7,95:1).

**Note :** la landing utilisait une palette inspirée d'un autre design system (« CNX 4.0 »). Les classes ont été gardées (`bg-profond`, `text-cnx`, `bg-vif`, `text-pousse`…), mais leurs valeurs sont désormais celles de la charte. N'ajoutez pas de nouvelle couleur en dur : prenez-la dans le tableau ci-dessus.

## Les polices

| Police | Usage | Graisses disponibles | Classe |
|---|---|---|---|
| Outfit | Textes et titres | 300, 400, 500, 600, 700, 800 | `font-sans`, `font-display` |
| JetBrains Mono | Chiffres, mesures, données NASA | 400, 700 | `font-mono` |

Les grands titres sur fond sombre peuvent reprendre le style du brand board : Outfit en gras, capitales, Jaune Soleil sur Vert Forêt.

## Hors du site web

- **Bot Telegram** : dans @BotFather, `/setuserpic` puis envoyer `public/brand/icone-app-512.png` ; `/setdescription` avec le slogan.
- **Slides et vidéo** : mêmes logos (`public/brand/`), mêmes couleurs et polices (`src/app/fonts/`).
