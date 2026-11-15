# PROMPT POUR CLAUDE CODE — Landing page S'STACK : en-tête en verre dépoli, survols et animations

> **Comment l'utiliser :** ce fichier est dans `docs/PROMPT_LANDING_UI.md`. Dans Claude Code, écrire :
> *« Lis docs/PROMPT_LANDING_UI.md en entier, puis réalise uniquement l'ÉTAPE 1. Arrête-toi à la fin et montre-moi le critère de fin. »*
> Puis : *« Étape 1 validée. Réalise l'ÉTAPE 2. »*, et ainsi de suite.

---

## 0. Ton rôle et le résultat attendu

Tu es un designer UI/UX senior et un développeur front-end expert (Next.js 16, React 19, Tailwind CSS 4). Tu travailles sur la **landing page** de S'STACK : `web/src/app/page.tsx` et `web/src/components/landing/*`.

**Ce qui ne va pas aujourd'hui :** la page est jolie mais **statique**. Rien ne réagit au survol de la souris, rien n'apparaît en douceur au défilement. Et quand on fait défiler la page, l'en-tête devient une barre sombre pleine largeur, pendant que la pastille de navigation reste un bloc blanc opaque qui « colle » mal au reste.

**Ce que je veux :** une landing qui respire et réagit, avec le niveau de finition des grands sites produits (Apple, Stripe, Linear). Les mouvements doivent rester **doux, rapides et utiles**. Rien de clinquant, rien qui gêne la lecture.

### Règles obligatoires
1. **Lis d'abord** `web/IDENTITE_VISUELLE.md` et `web/FRONTEND.md`. Respecte la charte : couleurs de `globals.css` et `src/lib/marque.ts`, polices Outfit et JetBrains Mono, composant `Logo`. **N'ajoute aucune couleur en dur** hors charte.
2. **Aucune nouvelle dépendance** : pas de Framer Motion, pas de GSAP, pas d'AOS. Uniquement CSS (transitions, `@keyframes`), Tailwind 4 et un petit hook React avec `IntersectionObserver`.
3. **Animer seulement `transform` et `opacity`** (plus `background-color`, `border-color`, `box-shadow` pour les survols courts). Jamais `width`, `height`, `top` ou `left` en animation : ça saccade.
4. **Accessibilité :**
   - tout effet de survol a son équivalent au clavier (`focus-visible`) ;
   - si l'utilisateur a demandé moins d'animations (`prefers-reduced-motion: reduce`), toutes les animations de défilement et les déplacements sont coupés (les changements de couleur peuvent rester) ;
   - les contrastes de texte restent conformes WCAG AA (4,5:1 pour le texte normal).
5. **Performance :** le titre du hero et l'image du hero ne sont **jamais** cachés au chargement (pas d'`opacity: 0` au départ) : ce sont les premiers éléments que voit le visiteur et ce qui compte pour la vitesse perçue. Les animations d'apparition concernent uniquement ce qui est **sous la ligne de flottaison**.
6. **Ne change aucun texte** de la page, ni le back-end, ni les pages de l'application (`(app)/*`).
7. Une étape à la fois. À la fin de chaque étape, arrête-toi et montre-moi le résultat.

---

## 1. Les bases : jetons de mouvement et d'élévation

Dans `web/src/app/globals.css`, ajoute des variables réutilisées partout (et des utilitaires Tailwind si utile) :

```css
:root {
  /* Courbes et durées des mouvements */
  --ease-sortie: cubic-bezier(0.22, 1, 0.36, 1);   /* démarre vite, finit en douceur : la courbe « premium » */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --duree-rapide: 150ms;   /* changements de couleur au survol */
  --duree: 250ms;          /* survols avec déplacement */
  --duree-lente: 600ms;    /* apparitions au défilement */

  /* Élévation (ombres teintées de Vert Forêt, plus naturelles qu'un gris pur) */
  --ombre-1: 0 1px 2px rgb(11 93 59 / 0.06), 0 1px 3px rgb(17 26 20 / 0.08);
  --ombre-2: 0 4px 12px -2px rgb(11 93 59 / 0.10), 0 2px 6px -2px rgb(17 26 20 / 0.08);
  --ombre-3: 0 18px 40px -12px rgb(11 93 59 / 0.22), 0 8px 16px -8px rgb(17 26 20 / 0.12);
}
```

Toutes les étapes suivantes utilisent **ces** variables : pas de durées ni d'ombres inventées au cas par cas.

---

## ÉTAPE 1 — L'en-tête qui se transforme en verre dépoli au défilement

Fichier : `web/src/components/landing/EnTeteLanding.tsx`.

### Ce que je veux voir, en clair
- **En haut de la page** (sur la photo du hero) : on garde l'état actuel. En-tête transparent, logo blanc, pastille de navigation blanche.
- **Dès qu'on commence à défiler** : l'en-tête **ne devient plus une barre sombre**. Il se transforme, en douceur, en **une barre de verre dépoli claire** : un fond blanc semi-transparent avec un flou derrière, à travers lequel on devine le contenu qui défile. On lit **toujours parfaitement** le logo, « Accueil », « Solutions », etc., que l'en-tête soit au-dessus d'une photo sombre, d'une section blanche ou de la section verte « Méthode ».

### Les valeurs précises (état « défilé »)
| Élément | Valeur |
|---|---|
| Fond de la barre | blanc à **72 %** d'opacité (`bg-white/72`) |
| Flou d'arrière-plan | `backdrop-blur` de **16 px**, avec `backdrop-saturate` à **160 %** (les couleurs derrière restent vivantes) |
| Bordure basse | 1 px, Noir Ébène à 6 % (`border-ink/6`) |
| Ombre | `var(--ombre-2)` |
| Hauteur | de 80 px à **64 px** |
| Logo | passe de la version négative (blanche) à la version **principale** (`<Logo />` au lieu de `<Logo clair />`), avec un fondu enchaîné : les deux logos sont superposés et on fait varier leur `opacity`, sans saut de mise en page. Hauteur 30 px → 26 px via `transform: scale`. |
| Pastille de navigation | son fond blanc devient **transparent** (elle se fond dans le verre) ; texte en Noir Ébène ; l'élément actif reste en Vert Forêt avec texte blanc |
| Bouton « Se connecter » | passe de blanc sur transparent à un contour Vert Forêt avec texte Vert Forêt |
| Bouton « Créer un compte » | inchangé (Vert Forêt plein, texte blanc) |

Si le navigateur ne gère pas `backdrop-filter`, prévoir un repli : fond blanc à 94 % (`@supports not (backdrop-filter: blur(1px))`).

### Le mouvement
- Toutes les propriétés changent ensemble en **`var(--duree-lente)` avec `var(--ease-sortie)`** : c'est ce fondu qui donne l'effet « qui s'estompe ».
- Ne déclenche pas l'état « défilé » au moindre pixel : seuil à **24 px** (déjà en place, à garder).
- **L'en-tête reste toujours visible** : il ne disparaît pas quand on descend.

### Bonus de finition (dans cette étape)
1. **Indicateur glissant dans la pastille de navigation** : au lieu que le fond vert « saute » d'un lien à l'autre, une seule pastille verte **glisse** sous le lien actif (position et largeur calculées sur le lien actif, animées en `transform` avec `var(--duree)` et `var(--ease-sortie)`). Au survol d'un lien non actif : fond Pierre de Mbigou éclaircie (`bg-pale`) qui apparaît en fondu.
2. **Barre de progression de lecture** : une ligne de 2 px tout en bas de l'en-tête, qui se remplit de gauche à droite selon le défilement de la page (`transform: scaleX()`, origine à gauche), en Vert Gabon `#009E60`. Visible uniquement en état « défilé ».
3. **Menu mobile** (le bouton ☰ et sa liste) : ouverture en fondu et léger glissement vers le bas (8 px), 200 ms, et le même fond en verre dépoli.

**Critère de fin :** montre-moi 4 captures à **1440 px** de large : (1) tout en haut sur le hero ; (2) en-tête défilé au-dessus d'une section blanche ; (3) au-dessus de la section verte « Méthode » ; (4) au-dessus du pied de page sombre. Sur les quatre, le logo et les menus se lisent parfaitement. Plus 2 captures à **390 px** (en haut, puis défilé, menu ☰ ouvert). Et `npm run build` sans erreur.

---

## ÉTAPE 2 — Les effets de survol (hover) sur tous les éléments cliquables

Principe : **chaque élément cliquable doit « répondre » quand la souris passe dessus**, pour que l'utilisateur sente qu'il peut cliquer. Les effets ne s'appliquent que sur les appareils avec souris (Tailwind 4 le fait déjà avec `hover:`). Chaque effet a son équivalent `focus-visible` pour le clavier.

| Élément | Effet au survol (durée `var(--duree)`, courbe `var(--ease-sortie)`) |
|---|---|
| **Boutons pleins** (Vert Forêt) | couleur → `vif-hover`, monte de 1 px (`translateY(-1px)`), ombre `--ombre-1` → `--ombre-2`. Au clic (`active`) : redescend et se compresse légèrement (`scale(0.98)`) |
| **Boutons contour** (« Voir le tableau de bord », « Se connecter », « Tout voir ») | fond légèrement teinté (blanc 15 % sur fond sombre, `bg-pale` sur fond clair), bordure plus marquée |
| **Icône flèche dans un bouton ou un lien** (→, ↗) | glisse de 3 px dans sa direction |
| **Cartes** (solutions, outils, repères par culture, questions, cartes vitrées du hero) | monte de 4 px, ombre `--ombre-1` → `--ombre-3`, bordure qui passe à Vert Forêt 20 %. Si la carte a une photo : la photo zoome doucement à **105 %** dans son cadre (`overflow-hidden` sur le cadre, durée 700 ms) |
| **Liens texte** (pied de page, « Voir les questions ») | soulignement qui se dessine de gauche à droite (pseudo-élément `::after` en `scaleX` de 0 à 1) |
| **Lignes de la liste « Solutions »** | fond qui s'éclaircit en fondu, titre en Vert Forêt, bouton ↗ qui tourne légèrement (−45° → 0°) |
| **Flèches du carrousel** | fond Vert Forêt, icône blanche, petite mise à l'échelle (1,05) |
| **Pastilles d'icônes** (carrés ou ronds autour des icônes) | légère rotation (−6°) et changement de teinte |
| **Bulle flottante de l'agent Mbolo** | grossit à 1,06 avec une ombre plus forte ; pas de rebond agressif |

**Focus clavier** (pour tous) : anneau de 2 px, décalé de 2 px (`outline-offset`), en Vert Forêt sur fond clair et en Jaune Soleil sur fond sombre.

Organise ça proprement : crée des **classes utilitaires réutilisables** dans `globals.css` (par exemple `.carte-interactive`, `.bouton-plein`, `.lien-souligne`, `.fleche-glisse` avec `group-hover`) plutôt que de répéter dix classes Tailwind partout.

**Critère de fin :** liste-moi chaque composant modifié et l'effet appliqué. Montre 3 captures avec la souris au survol : une carte de « Solutions », un bouton du hero, une carte « Repères par culture ». Puis vérifie au clavier (touche Tab) que chaque élément cliquable a un focus visible.

---

## ÉTAPE 3 — Les apparitions au défilement et les micro-animations

1. **Hook `useApparition`** (nouveau fichier `web/src/lib/use-apparition.ts`) avec `IntersectionObserver` : quand un élément entre à 15 % dans l'écran, il reçoit l'attribut `data-visible="true"`. **Une seule fois** : il ne disparaît pas quand on remonte.
2. **Classe `.apparait`** dans `globals.css` : départ `opacity: 0` et `translateY(16px)`, arrivée `opacity: 1` et `translateY(0)`, durée `var(--duree-lente)`, courbe `var(--ease-sortie)`.
   **Décalage en cascade** pour les grilles et les listes : chaque élément apparaît 80 ms après le précédent (variable CSS `--delai` sur chaque enfant). Au maximum 6 éléments en cascade, les suivants arrivent ensemble.
3. **Où l'appliquer :** titres et sur-titres des sections (À propos, Solutions, Outils, Méthode, Questions, Repères, Appel), lignes de la liste Solutions, cartes Outils, étapes de la Méthode, cartes Repères, colonnes du pied de page. **Pas** sur le hero (règle de performance n° 5).
4. **Hero :**
   - zoom très lent de la photo de fond au chargement (`scale(1.06)` → `scale(1)` sur 1,6 s) ;
   - les 4 cartes vitrées arrivent en cascade **après** le titre (le titre, lui, est visible tout de suite) ;
   - le bandeau des chiffres du bas (« 30 j », « 4 cultures », « 2 canaux ») fait compter les nombres de 0 à leur valeur en 800 ms quand il devient visible (seulement pour les nombres).
5. **Images de la phrase « À propos »** (les petites photos insérées dans le texte) : légère apparition en zoom (0,9 → 1) quand la phrase devient visible.
6. **`prefers-reduced-motion: reduce`** : `.apparait` est visible tout de suite, sans déplacement ; pas de zoom du hero ; les nombres s'affichent directement.
7. **Sécurité :** si JavaScript ne se charge pas, tout doit rester visible. La classe qui cache au départ ne s'applique que quand le hook a démarré (par exemple via une classe `js-anime` posée sur `<html>`).

**Critère de fin :** décris-moi le comportement en faisant défiler toute la page. Confirme avec l'option « Réduire les animations » activée (outils de développement → Rendering → `prefers-reduced-motion`) que tout est visible sans mouvement. Et `npm run build` sans erreur.

---

## ÉTAPE 4 — Finition des couleurs : une landing jolie et professionnelle

Objectif : garder **les couleurs de la charte**, mais avec plus de profondeur et de rythme.
1. **Rythme des sections :** alterne de façon régulière blanc (`bg-white`), Pierre de Mbigou éclaircie (`bg-pale`) et une section sombre (Vert Forêt) pour les moments forts (Méthode, Appel). Jamais deux sections de même fond qui se suivent sans séparation.
2. **Profondeur des sections sombres :** au lieu d'un aplat uni, un dégradé très léger du Vert Forêt `#0B5D3B` vers un Vert Forêt plus profond `#08472D`, avec un halo radial très discret (Vert Gabon à 12 % d'opacité) dans un coin. Toujours lisible, jamais criard.
3. **Le Jaune Soleil reste rare :** un seul accent jaune par écran (mot clé d'un titre sur fond sombre, petit point d'état). Jamais du texte jaune sur fond clair.
4. **Ombres et bordures harmonisées :** toutes les cartes utilisent les ombres `--ombre-*` et une bordure de 1 px en Noir Ébène à 6 %. Fini les ombres grises différentes d'une section à l'autre.
5. **Coins arrondis cohérents :** 999 px pour les boutons et pastilles, 24 px pour les grandes cartes, 16 px pour les petites, 12 px pour les champs.
6. **Hiérarchie typographique :** titres en Outfit 700, interlignage serré (1,05 à 1,1) et approche légèrement négative (−0,02 em) ; textes courants en Outfit 400, interlignage 1,6 ; chiffres et données en JetBrains Mono.
7. **Sélection de texte** aux couleurs de la marque (`::selection` : fond Vert Forêt à 15 %, texte Noir Ébène).

**Critère de fin :** captures de la page entière à 1440 px et à 390 px. Liste les changements de couleur faits section par section, et confirme que chaque texte atteint au moins 4,5:1 de contraste.

---

## ÉTAPE 5 — Contrôle qualité final

1. `npm run build` sans erreur ni avertissement nouveau, et `npm run lint` sans erreur.
2. Aucun « saut » de mise en page pendant le chargement (pas de décalage visible quand les polices ou les images arrivent).
3. Défilement fluide, sans saccade, sur la page entière (onglet Performance des outils de développement si besoin).
4. Test au clavier complet : Tab, puis Entrée sur la navigation, les boutons et les cartes.
5. Test avec « Réduire les animations ».
6. Test à 390 px, 768 px, 1024 px et 1440 px de large.
7. Mets à jour `web/FRONTEND.md` avec une courte section « Mouvements et survols » : les jetons, les classes utilitaires, le hook `useApparition`, et les règles (seulement `transform` et `opacity`, hero jamais caché, mouvements réduits respectés).
