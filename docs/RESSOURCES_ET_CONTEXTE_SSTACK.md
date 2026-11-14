# Ressources du défi Field Shift : le tri et le mode d'emploi pour S'STACK

> Ce fichier va dans `docs/RESSOURCES_ET_CONTEXTE_SSTACK.md`. Il complète `docs/BRIEF_CONTEXTE_SSTACK.md`.
> Source : onglet **Resources** de la page officielle du défi
> https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/?tab=resources

---

## 1. Ce que le défi nous demande vraiment (à garder en tête)

D'après la page officielle, l'outil doit :
1. Utiliser des **observations de la NASA**, avec des informations locales sur les sols, les cultures et les priorités des agriculteurs.
2. Aider à **explorer des stratégies de rotation** qui améliorent la santé des sols et l'adaptation au climat.
3. **Comparer au moins 3 stratégies de rotation, dont la rotation actuelle.** Pour chacune, dire : pourquoi elle est proposée, quelles preuves la soutiennent, ses bénéfices, les informations qui manquent, et les risques à faire vérifier par des agriculteurs ou des experts locaux.
4. Montrer par exemple les **périodes où les champs sont nus**, les **saisons où les cultures sont vulnérables**.
5. Rester un **outil d'aide** : il ne remplace pas le jugement de l'agriculteur.

👉 Le point 3 est **notre grille de réponse** pour les questions de rotation. Il doit être écrit dans le skill (voir partie 5).

---

## 2. Le tri des ressources : 4 catégories

La page liste environ 25 sources, en vrac. Beaucoup ne servent à rien pour le Gabon. Voici le tri.

### 🟢 Catégorie A — À UTILISER MAINTENANT (dans le code, pendant les 48 h)

| Ressource | Ce qu'on en tire | Comment on y accède | Ce que ça devient dans le contexte |
|---|---|---|---|
| **NASA POWER — données quotidiennes** | Pluie, températures, humidité de l'air, humidité du sol au jour près, depuis 1981, pour n'importe quel point du Gabon | API web, **sans compte ni clé** : `https://power.larc.nasa.gov/api/temporal/daily/point?...` | Les lignes chiffrées de la **fiche parcelle** : pluie des 7 et 30 derniers jours, jours secs, humidité du sol, température, démarrage de la saison |
| **NASA POWER — climatologie** | Les **normales** : la pluie moyenne de chaque mois sur le long terme | API web, sans compte : `https://power.larc.nasa.gov/api/temporal/climatology/point?...` | La comparaison « **normale** » de la fiche parcelle : « 62 mm, alors que la normale est de 140 mm » |

C'est **tout ce qu'il faut** pour une démo solide. NASA POWER est dans la liste officielle, couvre tout le Gabon et marche tout de suite.

Les paramètres NASA POWER à demander :
| Code NASA | Signification simple | Unité |
|---|---|---|
| `PRECTOTCORR` | Pluie | mm par jour |
| `T2M_MAX` / `T2M_MIN` | Température maximale / minimale à 2 m du sol | °C |
| `RH2M` | Humidité de l'air | % |
| `GWETROOT` | Humidité du sol au niveau des racines | de 0 (sec) à 1 (saturé) |
| `ALLSKY_SFC_SW_DWN` | Énergie du soleil reçue (optionnel) | kWh/m²/jour |

Toujours ajouter `community=AG` (agriculture). La valeur `-999` signifie « donnée manquante ».

### 🟡 Catégorie B — À LIRE PAR UN HUMAIN, PUIS À ÉCRIRE DANS LES FICHES (pas de code)

| Ressource | Ce qu'on en tire | Comment s'en servir |
|---|---|---|
| **FAO GAEZ** (gaez.fao.org) | L'aptitude des terres et du climat pour chaque culture (manioc, plantain, arachide, maïs…), les contraintes des sols, les rendements potentiels, **pour le monde entier, Gabon compris** | Un membre de l'équipe ouvre le portail, regarde les cartes d'aptitude du manioc, de l'arachide et du maïs sur la Nyanga, et **écrit ce qu'il voit en phrases simples** dans une nouvelle fiche `knowledge/fiches/aptitude-cultures.md`, en citant la source (voir partie 4) |
| Texte de la page du défi lui-même | Les bons principes de rotation : légumineuses qui fixent l'azote, plantes de couverture, cultures à racines profondes, cultures tolérantes à la sécheresse | Déjà repris en partie dans `rotations.md` : compléter avec ces 4 familles de cultures |

👉 Règle : **on ne colle jamais une carte ou un PDF entier dans le contexte.** On lit, on résume en lignes courtes et exactes, et on cite la source.

### 🔵 Catégorie C — PLUS TARD (après la démo, ou bonus si tout marche)

| Ressource | Pourquoi plus tard |
|---|---|
| **GPM / IMERG** (pluie satellite plus précise) | Demande un compte NASA Earthdata et des fichiers lourds. Exception utile tout de suite : **Worldview** permet de télécharger des **images** de pluie IMERG pour les slides du pitch (pas pour le contexte) |
| **SMAP** (humidité du sol satellite) | Fichiers lourds (HDF5). NASA POWER donne déjà `GWETROOT` |
| **MODIS / VIIRS / Landsat** (santé de la végétation, NDVI) | Bonne idée pour une ligne « état de la végétation » dans la fiche parcelle, mais demande Earthdata et un traitement d'images |
| **SRTM** (relief, pentes) | Utile pour le risque d'érosion, mais demande de traiter des fichiers d'altitude |
| **ECOSTRESS** | Couverture partielle, trop complexe pour 48 h |
| **ERA5** (ESA/ECMWF) et **Sentinel-2** (ESA) | Demandent un compte Copernicus ; NASA POWER suffit pour la démo |

### 🔴 Catégorie D — À IGNORER (États-Unis seulement)

Web Soil Survey, SSURGO/STATSGO2, Cropland Data Layer (CropScape), USDA NASS QuickStats, USDA AMS Market News, USDA Ag Data Commons, PRISM, NAIP, NLCD, OpenET, LANDFIRE, CoCoRaHS, USGS NWIS, NLDAS.
Elles sont excellentes… mais elles ne couvrent pas le Gabon. **Ne pas y passer de temps.**

(GLDAS, la version mondiale de NLDAS, existe sur Earthdata : catégorie C si besoin un jour.)

---

## 3. Les 3 chemins par lesquels une ressource devient du contexte

Toute information n'arrive au modèle que sous forme de **texte**. Il y a seulement 3 chemins :

| Chemin | Pour quoi | Exemple | Qui le fait |
|---|---|---|---|
| **1. Calculé par le code → fiche parcelle** | Les chiffres qui changent chaque jour et selon le lieu | NASA POWER → « Pluie des 30 derniers jours : 62 mm (normale 140 mm) » | Claude Code (étape 2 du brief) |
| **2. Écrit par un humain → fiches** | Le savoir stable : cultures, rotations, seuils, aptitudes | FAO GAEZ → « Aptitude du manioc dans la Nyanga : moyenne à bonne (source FAO GAEZ v4) » | Toi et l'équipe |
| **3. Découpé automatiquement → RAG** | Les gros documents qu'on ne peut pas résumer à la main | Un guide FAO de 80 pages | Plus tard (étape 6 du brief, optionnelle) |

Et un 4ᵉ usage, qui n'est **pas** du contexte : les **visuels pour le pitch et le site web** (images Worldview, graphiques du notebook Colab).

---

## 4. Le format d'une bonne ligne de fiche

Chaque information écrite dans une fiche doit être **courte, exacte et sourcée** :

```markdown
- Le manioc tolère des sols pauvres et acides mieux que le maïs. (source : FAO GAEZ v4) [À VALIDER]
```

Mauvais exemple (trop vague, sans source) :
```markdown
- Le manioc est une plante importante en Afrique qui pousse dans beaucoup de conditions.
```

Règles :
1. **Une idée par ligne.**
2. **Une source** entre parenthèses quand elle existe.
3. `[À VALIDER]` tant qu'aucune personne du terrain n'a confirmé.
4. Pas de chiffre inventé : si tu ne sais pas, n'écris rien.

---

## 5. Les ajouts à faire dans `knowledge/`

### 5.1 Compléter le skill : `knowledge/skills/climat/SKILL.md`

Ajouter cette section à la fin (c'est la grille demandée par le défi) :

```markdown
# Quand le producteur demande quoi planter ou quelle rotation choisir
Tu compares TOUJOURS au moins 3 stratégies, dont sa rotation actuelle.
Pour chacune, en une ligne par point :
- Pourquoi elle est proposée ;
- Ce qui la justifie (chiffres de la fiche parcelle, ou fiche de connaissances) ;
- Les bénéfices possibles (sol, eau, revenu) ;
- Ce qu'on ne sait pas encore (informations manquantes) ;
- Les risques, et ce qu'un agronome local devrait vérifier.
Termine par celle qui te semble la plus adaptée, en rappelant que la décision revient au producteur.
Pour ce type de question, tu peux dépasser 5 phrases (15 lignes maximum).
```

### 5.2 Créer la fiche `knowledge/fiches/aptitude-cultures.md` (à remplir à la main depuis FAO GAEZ)

```markdown
---
name: aptitude-cultures
description: Aptitude des terres et du climat pour les principales cultures dans les zones pilotes, d'après FAO GAEZ.
---

# Nyanga (zone pilote)
- Manioc : aptitude ___ (source : FAO GAEZ v4) [À VALIDER]
- Banane plantain : aptitude ___ (source : FAO GAEZ v4) [À VALIDER]
- Arachide : aptitude ___ (source : FAO GAEZ v4) [À VALIDER]
- Maïs : aptitude ___ (source : FAO GAEZ v4) [À VALIDER]
- Principales contraintes du sol relevées : ___ (source : FAO GAEZ v4) [À VALIDER]

# Comment lire ces aptitudes
- Ce sont des estimations à grande échelle : elles ne remplacent pas l'observation de la parcelle.
```

Remplis les `___` en regardant les cartes sur gaez.fao.org. Si tu ne trouves pas une valeur, supprime la ligne plutôt que d'inventer.

### 5.3 Compléter `knowledge/fiches/rotations.md`

Ajouter les 4 familles de cultures citées par le défi :

```markdown
# Les 4 familles utiles dans une rotation (d'après la page du défi Field Shift)
- Légumineuses (arachide, niébé, haricot) : fixent l'azote de l'air et enrichissent le sol.
- Plantes de couverture : protègent le sol nu des fortes pluies et limitent l'érosion.
- Cultures à racines profondes : améliorent la structure du sol et l'infiltration de l'eau.
- Cultures tolérantes à la sécheresse : réduisent le risque quand les pluies sont irrégulières.
```

### 5.4 Ajouter une ligne dans la fiche parcelle : les périodes de sol nu

Le défi parle des « périodes où les champs sont nus ». Avec la climatologie NASA POWER, le code peut ajouter une ligne simple à la fiche parcelle :
```
Mois habituellement les plus secs ici (normales NASA) : juin, juillet, août → sol nu à protéger
```
(Calcul : les 3 mois dont la pluie normale est la plus faible.)

---

## 6. Ordre de travail précis à partir de maintenant

État du projet au 14/11/2026 à 15 h 50 :
- ✅ Étape 1 : skill + 4 fiches créés.
- ✅ Passerelle LLM : `gateways/llm.ts` (Groq + secours Gemini) et `gateways/voice.ts` (Whisper Groq) écrits.
- ⏳ Étape 2 (fiche parcelle) : pas encore commencée (`server/src/context/` n'existe pas).
- ⏳ Étapes 3, 4, 5 : à faire.

### Pour toi (Rody), dans ton `server/.env`

`llm.ts` et `voice.ts` attendent **3 variables** en plus des clés :
```
GROQ_MODEL=        ← nom exact d'un modèle de chat, copié depuis la page Models de console.groq.com
GEMINI_MODEL=      ← nom exact d'un modèle Gemini Flash, copié depuis aistudio.google.com
GROQ_STT_MODEL=    ← nom exact d'un modèle Whisper, copié depuis la page Models de console.groq.com
```
Sans elles, le serveur affichera « Variable d'environnement manquante ».

### Messages à donner à Claude Code, un par un

**Message A — tester la passerelle LLM**
```
Crée server/src/scripts/test-llm.ts qui appelle demanderLLM avec le message « Dis bonjour en une phrase »
et affiche le texte, le fournisseur et le modèle. Lance-le avec npx tsx et montre-moi le résultat.
```

**Message B — la fiche parcelle (ÉTAPE 2 + compléments)**
```
Lis docs/BRIEF_CONTEXTE_SSTACK.md et docs/RESSOURCES_ET_CONTEXTE_SSTACK.md.
Réalise l'ÉTAPE 2 du brief (nasa-power.ts, indicateurs.ts, fiche-parcelle.ts), avec en plus :
1. la climatologie NASA POWER pour la ligne « normale » ;
2. la ligne « Mois habituellement les plus secs ici » (partie 5.4 du fichier RESSOURCES) ;
3. pas encore de données de sol : crée knowledge/data/soilgrids-sites.json avec des valeurs null,
   et la fiche affiche « Sol : données non disponibles ».
Termine en affichant la vraie fiche parcelle de Tchibanga et de Libreville.
```

**Message C — l'assemblage (ÉTAPE 3)**
```
Réalise l'ÉTAPE 3 du brief. Affiche le contexte complet assemblé pour Tchibanga avec la question
« Est-ce que je peux planter mon manioc cette semaine ? » et son nombre de mots.
```

**Message D — l'agent et les tests (ÉTAPES 4 et 5)**
```
Réalise l'ÉTAPE 4 puis l'ÉTAPE 5 du brief. Ajoute aux questions de test :
« Compare trois rotations pour ma parcelle, dont ma rotation actuelle manioc puis manioc. »
Lance le script de test et montre-moi le fichier de résultats.
```

### Pendant que Claude Code travaille (toi et l'équipe)
1. Ajouter la section du point 5.1 dans le skill.
2. Créer et remplir `aptitude-cultures.md` depuis FAO GAEZ (point 5.2).
3. Compléter `rotations.md` (point 5.3).
4. Faire valider les lignes `[À VALIDER]` par une personne du terrain.
5. Télécharger 2 ou 3 images de pluie IMERG sur Worldview pour les slides.
