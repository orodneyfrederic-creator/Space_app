// Explications en français facile, affichées dans les infobulles « i » (survol, toucher ou clavier).
// Public : un producteur qui lit peu et utilise surtout son téléphone.
// Règles d'écriture : phrases courtes, mots de tous les jours, aucun chiffre qui ne vienne pas du calcul réel.

export type Explication = { titre: string; texte: string }

export const EXPLICATIONS = {
  site: {
    titre: 'Le site',
    texte: 'Choisissez la ville la plus proche de vos champs. Tous les chiffres de la page sont ceux de cette ville.',
  },
  verdict: {
    titre: "L'avis pour semer",
    texte:
      "S'STACK regarde la pluie des derniers jours et l'eau dans la terre. Favorable : vous pouvez semer. Risquée : attention. Défavorable : mieux vaut attendre.",
  },
  nasa: {
    titre: 'Données NASA',
    texte: 'Ces chiffres viennent des satellites de la NASA. Ils sont gratuits et arrivent avec quelques jours de retard.',
  },
  pluie7: {
    titre: 'Pluie 7 jours',
    texte:
      "Toute la pluie tombée ces 7 derniers jours, en millimètres (mm). Plus le nombre est grand, plus il a plu. « vs normale » compare avec la pluie habituelle : + veut dire plus que d'habitude, − veut dire moins.",
  },
  pluie30: {
    titre: 'Pluie 30 jours',
    texte:
      "Toute la pluie tombée ces 30 derniers jours, en millimètres (mm). « vs normale » compare avec la pluie habituelle à cette période, calculée par la NASA sur de nombreuses années.",
  },
  solHumidite: {
    titre: 'État du sol',
    texte: "L'eau dans la terre, là où poussent les racines. Les satellites de la NASA la mesurent. Pour semer, il faut une terre assez humide.",
  },
  tmax: {
    titre: 'Température max',
    texte: 'La plus forte chaleur de la journée, en degrés (°C). Ici, c’est la moyenne des 7 derniers jours.',
  },
  saison: {
    titre: 'Saison des pluies',
    texte:
      'Elle a démarré quand il a plu au moins 20 mm en 3 jours, sans longue période sèche juste après. On compte à partir du 1er septembre.',
  },
  solSurface: {
    titre: 'Humidité en surface',
    texte: 'L’eau dans les tout premiers centimètres de terre. Elle change vite : elle monte après une pluie et baisse au soleil. 0 % = terre sèche, 100 % = terre gorgée d’eau. (NASA : GWETTOP)',
  },
  solRacines: {
    titre: 'Eau au niveau des racines',
    texte: 'L’eau dans la terre là où vivent les racines des boutures. C’est la plus importante pour planter. 0 % = sec, 100 % = gorgé d’eau. (NASA : GWETROOT)',
  },
  solProfond: {
    titre: 'Humidité en profondeur',
    texte: 'L’eau gardée plus bas dans le sol, la réserve. Elle change lentement, sur plusieurs semaines. (NASA : GWETPROF)',
  },
  tempSurface: {
    titre: 'Température de surface du sol',
    texte: 'La chaleur de la surface de la terre, vue par satellite. Ce n’est pas la température en profondeur. (NASA : TS)',
  },
  maille: {
    titre: 'Zone d’environ 50 km',
    texte: 'La NASA donne une valeur pour un grand carré d’environ 50 km de côté. Votre position choisit le bon carré, mais ne mesure pas votre champ au mètre près.',
  },
  action: {
    titre: 'Que faire maintenant',
    texte: 'Cette phrase vient de règles fixes : l’eau dans le sol, la pluie et le démarrage de la saison. Mbolo peut vous l’expliquer, mais il ne la change pas.',
  },
} as const satisfies Record<string, Explication>

export type SujetExplication = keyof typeof EXPLICATIONS
