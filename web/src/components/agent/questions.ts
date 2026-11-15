// Questions de l'agent flottant, selon la page où se trouve la personne (même principe que Linky de CNX LINK).
// - Une question avec `reponse` reçoit une réponse rapide, écrite ici, avec des liens qui guident vers la bonne page.
// - Une question sans `reponse` est transmise au vrai agent S'STACK (POST /api/conseil), avec les données NASA du site choisi.
// Les réponses rapides décrivent les règles réelles du serveur (server/src/context/indicateurs.ts), seuils encore à valider.
import { CULTURES } from '@/lib/cultures'

/** Nom de l'agent, affiché partout (bulle, fenêtre, boutons). « Mbolo » : « bonjour » au Gabon. */
export const NOM_AGENT = 'Mbolo'

export type QuestionRapide = {
  texte: string
  /** Réponse rapide (texte simple : paragraphes, listes « - », **gras**, [lien](/page)). Absente : question pour l'agent. */
  reponse?: string
  /** Mots qui déclenchent la réponse rapide quand la personne écrit elle-même une question d'orientation. */
  motsCles?: readonly string[]
}

const manioc = CULTURES.find((c) => c.id === 'manioc')

const Q = {
  cestQuoi: {
    texte: "C'est quoi S'STACK ?",
    reponse:
      "S'STACK aide les producteurs gabonais à choisir le bon moment pour semer. Chaque jour, il récupère la pluie, la température et l'humidité du sol mesurées par la NASA pour chaque site suivi, et en tire un **verdict de semis** : favorable, risquée ou défavorable.\n\nCommencez par le [tableau de bord](/tableau-de-bord) ou la [carte des sites](/carte).",
    motsCles: ['sstack', 's stack', 'application', 'plateforme'],
  },
  sources: {
    texte: "D'où viennent les données ?",
    reponse:
      "- **Pluie, température, humidité du sol** : NASA POWER, pour chaque site suivi.\n- **Texture et acidité du sol** : SoilGrids (ISRIC), une estimation à 250 m.\n\nLe détail est sur la page [Données](/donnees).",
    motsCles: ['source', 'nasa', 'soilgrids', 'donnees'],
  },
  verdict: {
    texte: 'Comment lire le verdict de semis ?',
    reponse:
      "Le verdict suit des règles simples, encore à valider par un agronome :\n- **Défavorable** : la grande saison des pluies n'a pas encore démarré, ou le sol est sec.\n- **Risquée** : la saison a démarré, mais il y a eu 7 jours secs d'affilée, ou trop de jours secs sur les 14 derniers jours.\n- **Favorable** : saison démarrée, sol assez humide et moins de 5 jours secs sur 14.\n\nVoyez celui de votre site sur le [tableau de bord](/tableau-de-bord).",
    motsCles: ['verdict', 'favorable', 'defavorable'],
  },
  semer: { texte: 'Est-ce que je peux semer cette semaine ?' },
  compte: {
    texte: 'Comment créer un compte ?',
    reponse:
      "Remplissez le formulaire [Créer un compte](/inscription). La connexion n'est pas encore branchée : pour l'instant, valider le formulaire ouvre directement le [tableau de bord](/tableau-de-bord).",
    motsCles: ['compte', 'inscri'],
  },
  sansCompte: {
    texte: "Puis-je utiliser S'STACK sans compte ?",
    reponse:
      "Oui. Le [tableau de bord](/tableau-de-bord), la [carte](/carte) et les [données](/donnees) sont ouverts à tous. Le compte servira plus tard à retrouver vos sites et votre historique.",
    motsCles: ['sans compte'],
  },
  motDePasse: {
    texte: "J'ai oublié mon mot de passe",
    reponse:
      "La connexion n'est pas encore branchée, il n'y a donc pas encore de mot de passe à récupérer. [Se connecter](/connexion) avec n'importe quelle adresse ouvre le tableau de bord.",
    motsCles: ['mot de passe', 'connexion', 'connecter'],
  },
  telegram: {
    texte: "Comment utiliser S'STACK sur Telegram ?",
    reponse:
      "Le bot Telegram S'STACK répond aux mêmes questions. Envoyez **/start**, partagez votre position ou choisissez la ville la plus proche, puis posez votre question **par écrit ou par message vocal**. Ses conseils apparaissent aussi dans l'[historique](/historique).",
    motsCles: ['telegram'],
  },
  tableau: {
    texte: 'Que montre le tableau de bord ?',
    reponse:
      "Pour le site choisi : le **verdict de semis** et sa raison, la pluie des 7 et 30 derniers jours comparée à la normale, l'humidité du sol, la température maximale et le démarrage de la saison. À droite, la carte et le verdict de tous les sites suivis.\n\n[Ouvrir le tableau de bord](/tableau-de-bord)",
    motsCles: ['tableau de bord', 'accueil'],
  },
  changerSite: {
    texte: 'Comment changer de site ?',
    reponse:
      "Utilisez le sélecteur de site en haut de la page, ou cliquez sur un site dans la liste « Sites suivis » du [tableau de bord](/tableau-de-bord). Le choix est gardé sur toutes les pages, et je l'utilise aussi pour mes conseils.",
    motsCles: ['changer de site', 'autre site', 'choisir un site', 'selecteur'],
  },
  risquee: {
    texte: 'Que veut dire « risquée » ?',
    reponse:
      "La saison des pluies a démarré, mais la pluie est irrégulière : soit 7 jours secs d'affilée récemment, soit au moins 5 jours secs (moins de 1 mm) sur les 14 derniers jours. Les jeunes plants risquent de manquer d'eau.",
    motsCles: ['risquee', 'risque'],
  },
  pluieDetail: {
    texte: 'Où voir la pluie en détail ?',
    reponse: "Sur la page [Données](/donnees) : la pluie des 30 derniers jours, jour par jour, comparée à la normale de saison.",
    motsCles: ['pluie', 'graphique'],
  },
  carteLire: {
    texte: 'Comment lire la carte ?',
    reponse:
      "Chaque point est un site suivi. Sa couleur donne le verdict de semis :\n- **vert** : favorable\n- **jaune** : risquée\n- **brun** : défavorable\n- **gris** : données indisponibles\n\nCliquez sur un point pour ouvrir la fiche du site. [Ouvrir la carte](/carte)",
    motsCles: ['carte', 'couleur', 'marqueur'],
  },
  fiche: {
    texte: "Comment ouvrir la fiche d'un site ?",
    reponse: "Sur la [carte](/carte), cliquez sur le point du site : sa fiche s'ouvre avec la pluie, le sol et le verdict. Exemple : [la fiche de Tchibanga](/parcelles/tchibanga).",
    motsCles: ['fiche'],
  },
  ecart: {
    texte: 'Que veut dire « écart à la normale » ?',
    reponse:
      "C'est la pluie tombée comparée à la moyenne habituelle des mêmes jours (normales mensuelles NASA). **-40 %** veut dire 40 % de pluie en moins que d'habitude. Entre -30 % et +30 %, on reste proche de la normale.",
    motsCles: ['ecart', 'normale'],
  },
  humidite: {
    texte: "C'est quoi l'humidité du sol ?",
    reponse:
      "C'est l'indice NASA d'humidité de la zone des racines, de 0 à 1. S'STACK le lit ainsi (seuils encore à valider) :\n- moins de 0,4 : **sol sec**\n- de 0,4 à 0,7 : **sol assez humide**\n- plus de 0,7 : **sol humide**",
    motsCles: ['humidite', 'sol sec'],
  },
  saison: {
    texte: 'Comment est repéré le début de la saison ?',
    reponse:
      "À partir du 1er septembre, S'STACK cherche le premier jour où il tombe **au moins 20 mm en 3 jours**, sans **7 jours secs d'affilée** dans les 20 jours suivants. Tant que ces 20 jours ne sont pas passés, le démarrage reste « provisoire ».",
    motsCles: ['debut de saison', 'demarrage', 'saison des pluies'],
  },
  manioc: {
    texte: 'Quand planter le manioc ?',
    reponse: `${manioc?.repere ?? ''}\n\nCe repère est encore à valider. Les autres cultures sont sur la page [Cultures](/cultures).`,
  },
  rotation: { texte: 'Que planter après le manioc pour reposer la terre ?' },
  reperesValides: {
    texte: 'Ces repères sont-ils validés ?',
    reponse:
      "Pas encore : ils viennent des fiches de connaissances de l'équipe et doivent être relus par un agronome ou un producteur. C'est pour ça qu'ils portent l'étiquette « repère à valider ».",
    motsCles: ['valide'],
  },
  historique: {
    texte: "D'où viennent ces conseils ?",
    reponse:
      "Chaque question posée à l'agent, depuis le site ou depuis Telegram, est enregistrée avec sa réponse. L'[historique](/historique) montre les plus récentes.",
    motsCles: ['historique'],
  },
  agent: {
    texte: "Comment parler à l'agent au micro ?",
    reponse: "Écrivez votre question ici, je la transmets à l'agent avec les données NASA du site choisi. Pour parler au micro, ouvrez la [page Agent](/discuter).",
    motsCles: ['micro', 'vocal', 'voix'],
  },
} satisfies Record<string, QuestionRapide>

const TOUTES: readonly QuestionRapide[] = Object.values(Q)

/** Les questions proposées sur la page (les 5 premières servent de pastilles de départ). */
export function questionsPour(chemin: string): QuestionRapide[] {
  if (chemin === '/') return [Q.cestQuoi, Q.semer, Q.verdict, Q.sources, Q.compte]
  if (chemin.startsWith('/connexion') || chemin.startsWith('/inscription')) return [Q.compte, Q.motDePasse, Q.sansCompte, Q.cestQuoi, Q.telegram]
  if (chemin.startsWith('/tableau-de-bord')) return [Q.tableau, Q.semer, Q.changerSite, Q.risquee, Q.pluieDetail]
  if (chemin.startsWith('/carte')) return [Q.carteLire, Q.fiche, Q.changerSite, Q.verdict, Q.semer]
  if (chemin.startsWith('/donnees') || chemin.startsWith('/parcelles')) return [Q.ecart, Q.humidite, Q.saison, Q.sources, Q.semer]
  if (chemin.startsWith('/cultures')) return [Q.manioc, Q.rotation, Q.reperesValides, Q.semer, Q.changerSite]
  if (chemin.startsWith('/historique')) return [Q.historique, Q.telegram, Q.agent, Q.semer]
  return [Q.tableau, Q.semer, Q.verdict, Q.telegram]
}

/** Phrases montrées de temps en temps près de la bulle, en plus des questions de la page. */
export const INVITATIONS: readonly string[] = ['Une question ? Je suis là', 'Besoin d’aide pour semer au bon moment ?']

export const MESSAGE_ACCUEIL = `Bonjour, je suis ${NOM_AGENT} 👋 Je vous guide dans S'STACK et je transmets vos questions agricoles à l'agent, avec les données NASA de votre site.`

const normaliser = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['’«»?!.,:;]/g, ' ').replace(/\s+/g, ' ').trim()

/** Marques d'une question d'orientation (« où… », « comment… ») plutôt qu'agricole. */
const ORIENTATION = ['ou ', 'comment', 'voir', 'trouver', 'ouvrir', 'c est quoi', 'qu est', 'que veut dire', 'que montre', 'signifie', 'creer', 'utiliser', 'oublie', 'viennent', 'lire']

/**
 * Réponse rapide pour un texte : la question proposée identique, ou une question d'orientation qui contient
 * un mot-clé connu. Sinon `null` : la question part vers l'agent S'STACK.
 */
export function reponseRapide(texte: string): string | null {
  const t = normaliser(texte)
  const identique = TOUTES.find((q) => normaliser(q.texte) === t)
  if (identique) return identique.reponse ?? null
  const debut = ` ${t}`
  if (!ORIENTATION.some((m) => debut.includes(` ${m}`))) return null
  const trouvee = TOUTES.find((q) => q.reponse && q.motsCles?.some((m) => t.includes(m)))
  return trouvee?.reponse ?? null
}
