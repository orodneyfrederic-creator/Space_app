// MOTEUR DE DÉMONSTRATION de l'assistant (module 06) : il imite le comportement attendu du serveur
// pour construire et tester l'interface sans LLM. Aucune IA ici : de simples mots-clés.
// Le vrai agent (serveur) suivra le même déroulé :
//   1. identifier l'intention   2. récupérer les données autorisées (outils de lecture)
//   3. répondre / recommander    4. proposer une écriture, exécutée seulement après confirmation.
// Les chiffres de Tchibanga viennent d'une vraie sortie du serveur (FICHE_DEMO_TCHIBANGA).
// Pour les autres parcelles, la démo n'a pas de fiche : elle le dit au lieu d'inventer.
import { FICHE_DEMO_TCHIBANGA, PARCELLES_DEMO } from './donnees-demo'
import type {
  ActionProposee,
  AppelOutil,
  ConversationAssistant,
  JournalAction,
  MessageAssistant,
  OutilAssistant,
  Parcelle,
  ReponseAssistant,
} from './types'

/** Identifiant court, utilisable aussi en http:// sur le réseau local (où crypto.randomUUID n'existe pas). */
export function nouvelId(prefixe: string) {
  return `${prefixe}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms))

const nombre = (n: number, decimales = 1) => n.toLocaleString('fr-FR', { maximumFractionDigits: decimales })
const signe = (n: number | null) => (n === null ? 'n.c.' : `${n > 0 ? '+' : ''}${n} %`)

function outil(nom: OutilAssistant, libelle: string, args: Record<string, unknown>, resume: string): AppelOutil {
  return { id: nouvelId('outil'), outil: nom, libelle, arguments: args, statut: 'ok', resume }
}

type Intention = 'semis' | 'indicateurs' | 'parcelles' | 'cultures' | 'photo' | 'document' | 'autre'

function identifierIntention(texte: string, piece?: File): Intention {
  if (piece) return piece.type.startsWith('image/') ? 'photo' : 'document'
  const t = texte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (/\b(semer|semis|planter|plantation|bouture)/.test(t)) return 'semis'
  if (/\b(sol|humid|pluie|pluvio|indicateur|secheresse|temperature|chaleur)/.test(t)) return 'indicateurs'
  if (/\b(quelle culture|quoi planter|cultures?|rotation)/.test(t)) return 'cultures'
  if (/\b(parcelles?|exploitation|champs?)\b/.test(t)) return 'parcelles'
  return 'autre'
}

/** Prochain lundi, au format lisible */
function prochainLundi() {
  const d = new Date()
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7))
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function message(partiel: Omit<MessageAssistant, 'id' | 'role' | 'date'>): MessageAssistant {
  return { id: nouvelId('msg'), role: 'assistant', date: new Date().toISOString(), ...partiel }
}

/** Demander la parcelle quand l'intention en a besoin */
function demanderParcelle(): MessageAssistant {
  return message({
    parcelleId: null,
    texte:
      'Pour vous répondre avec vos vraies données, choisissez d’abord la parcelle concernée dans la liste en haut de l’écran, puis reposez votre question.',
  })
}

/** Simule POST /api/assistant/messages */
export async function repondreDemo(params: {
  conversationId: string | null
  message: string
  parcelle: Parcelle | null
  pieceJointe?: File
}): Promise<ReponseAssistant> {
  await attendre(900 + Math.random() * 900) // le vrai agent met 2 à 5 secondes
  const conversationId = params.conversationId ?? nouvelId('conv')
  const { parcelle } = params
  const intention = identifierIntention(params.message, params.pieceJointe)
  const parcelleId = parcelle?.id ?? null
  const fiche = parcelle?.id === 'tchibanga' ? FICHE_DEMO_TCHIBANGA : null

  const lireFiche = (p: Parcelle) =>
    outil(
      'consulter_parcelle',
      `Lecture de la fiche de ${p.nom}`,
      { parcelleId: p.id },
      fiche ? `Données NASA jusqu’au ${fiche.dernierJour}` : 'Pas de fiche de démo pour cette parcelle',
    )

  const sansFiche = (p: Parcelle) =>
    message({
      parcelleId,
      outils: [lireFiche(p)],
      texte: `Je n’ai pas encore de données pour ${p.nom} en mode démonstration (seule Tchibanga en a). Dès que le serveur sera branché, je lirai sa fiche NASA POWER et SoilGrids.`,
    })

  switch (intention) {
    case 'parcelles': {
      const liste = PARCELLES_DEMO.map((p) => `• ${p.nom}${p.culture ? ` — ${p.culture}` : ''}`).join('\n')
      return {
        conversationId,
        message: message({
          parcelleId,
          outils: [outil('lister_parcelles', 'Liste de vos parcelles', {}, `${PARCELLES_DEMO.length} parcelles autorisées`)],
          texte: `Vous suivez ${PARCELLES_DEMO.length} parcelles :\n${liste}\n\nChoisissez-en une en haut de l’écran pour parler de ses conditions.`,
        }),
      }
    }

    case 'indicateurs': {
      if (!parcelle) return { conversationId, message: demanderParcelle() }
      if (!fiche) return { conversationId, message: sansFiche(parcelle) }
      return {
        conversationId,
        message: message({
          parcelleId,
          outils: [
            lireFiche(parcelle),
            outil('lire_indicateurs', 'Calcul des indicateurs pluie et sol', { parcelleId, periode: '30 j' }, `Sol ${fiche.etatSol}`),
          ],
          recommandation: { type: 'conseil', estHypothese: false, sources: ['NASA POWER', 'SoilGrids'] },
          texte:
            `Voici l’état de ${parcelle.nom} :\n` +
            `• Pluie sur 30 jours : ${nombre(fiche.pluie30)} mm, soit ${signe(fiche.ecart30)} par rapport à la normale (${nombre(fiche.normale30)} mm).\n` +
            `• Pluie sur 7 jours : ${nombre(fiche.pluie7)} mm (${signe(fiche.ecart7)}).\n` +
            `• Jours secs sur 14 jours : ${fiche.secs14}.\n` +
            `• Sol : ${fiche.etatSol}${fiche.solTexture ? `, pH ${fiche.solTexture.ph}, ${nombre(fiche.solTexture.argile)} % d’argile` : ''}.\n\n` +
            'En clair : la saison des pluies est bien installée et le sol a de l’eau en réserve. Attention à l’excès d’eau dans les bas-fonds.',
        }),
      }
    }

    case 'semis': {
      if (!parcelle) return { conversationId, message: demanderParcelle() }
      if (!fiche) return { conversationId, message: sansFiche(parcelle) }
      const culture = parcelle.culture ?? 'manioc'
      const date = prochainLundi()
      const action: ActionProposee = {
        id: nouvelId('action'),
        outil: 'planifier_activite',
        titre: `Planifier le semis du ${culture}`,
        statut: 'proposee',
        details: [
          { label: 'Parcelle', valeur: parcelle.nom },
          { label: 'Activité', valeur: `Semis / bouturage du ${culture}` },
          { label: 'Date prévue', valeur: date },
          { label: 'Rappel', valeur: 'La veille, sur Telegram' },
        ],
      }
      return {
        conversationId,
        message: message({
          parcelleId,
          outils: [
            lireFiche(parcelle),
            outil('lire_indicateurs', 'Calcul de la fenêtre de semis', { parcelleId, culture }, `Verdict : ${fiche.evaluation.verdict}`),
          ],
          recommandation: { type: 'conseil', estHypothese: false, confiance: 0.8, sources: ['NASA POWER', 'Fiche calendrier-cultures'] },
          action,
          texte:
            `Oui, c’est un bon moment pour le ${culture} : ${fiche.evaluation.raison}. ` +
            `La parcelle a reçu ${nombre(fiche.pluie30)} mm en 30 jours (${signe(fiche.ecart30)} par rapport à la normale).\n\n` +
            'Plantez sur buttes pour éviter l’eau stagnante et paillez pour limiter l’érosion. Je peux ajouter ce semis à votre calendrier :',
        }),
      }
    }

    case 'cultures': {
      return {
        conversationId,
        message: message({
          parcelleId,
          outils: [
            outil('rechercher_connaissances', 'Recherche dans le calendrier des cultures', { saison: 'pluies' }, '3 fiches trouvées'),
            ...(parcelle && fiche ? [lireFiche(parcelle)] : []),
          ],
          recommandation: { type: 'conseil', estHypothese: false, sources: ['Fiche calendrier-cultures', 'Fiche rotations'] },
          texte:
            'En pleine saison des pluies, les cultures les mieux adaptées sont le manioc et la banane plantain. ' +
            'L’arachide est possible sur sol bien drainé. Le maïs est risqué tant que le sol reste saturé.\n\n' +
            'Le détail des scores est sur l’onglet « Cultures ».',
        }),
      }
    }

    case 'photo': {
      return {
        conversationId,
        message: message({
          parcelleId,
          outils: [
            outil('analyser_photo', 'Analyse visuelle de la photo', { fichier: params.pieceJointe?.name }, 'Symptômes repérés : jaunissement, taches'),
            ...(parcelle && fiche ? [lireFiche(parcelle)] : []),
          ],
          recommandation: { type: 'diagnostic', estHypothese: true, confiance: 0.55, sources: ['Analyse d’image (indicative)'] },
          texte:
            '(Exemple de démonstration : la photo n’est pas réellement analysée.)\n\n' +
            'Hypothèse : un jaunissement en mosaïque des feuilles de manioc peut évoquer la mosaïque africaine du manioc, ' +
            'mais aussi un manque d’azote ou un excès d’eau.\n\n' +
            'Pour vérifier : regardez si les feuilles sont déformées et si plusieurs plants voisins sont touchés. ' +
            'Faites confirmer par un agent technique avant d’arracher quoi que ce soit.',
        }),
      }
    }

    case 'document': {
      return {
        conversationId,
        message: message({
          parcelleId,
          texte: `J’ai bien reçu « ${params.pieceJointe?.name} ». La lecture des documents sera disponible quand le serveur sera branché. Dites-moi ce que vous voulez savoir à son sujet.`,
        }),
      }
    }

    default:
      return {
        conversationId,
        message: message({
          parcelleId,
          outils: [outil('rechercher_connaissances', 'Recherche dans la base de connaissances', { requete: params.message }, 'Aucune fiche précise')],
          texte:
            'Je peux vous aider sur : le bon moment pour semer, l’état de la pluie et du sol de vos parcelles, ' +
            'les cultures adaptées à la saison, ou un diagnostic à partir d’une photo de vos plants. Que voulez-vous savoir ?',
        }),
      }
  }
}

/** Simule POST /api/assistant/actions/:id */
export async function repondreActionDemo(action: ActionProposee, decision: 'confirmer' | 'annuler'): Promise<ActionProposee> {
  await attendre(500)
  return { ...action, statut: decision === 'confirmer' ? 'executee' : 'annulee' }
}

// Historique inventé, pour voir l'onglet « Historique » rempli
export const CONVERSATIONS_DEMO: ConversationAssistant[] = [
  {
    id: 'conv-demo-1',
    titre: 'Est-ce que je peux planter mon manioc cette semaine ?',
    date: '2026-11-14T09:12:00Z',
    parcelleId: 'tchibanga',
    canal: 'telegram',
    nbMessages: 2,
  },
  {
    id: 'conv-demo-2',
    titre: 'Taches jaunes sur les feuilles (photo)',
    date: '2026-11-12T16:40:00Z',
    parcelleId: 'mouila',
    canal: 'web',
    nbMessages: 4,
  },
]

export const JOURNAL_DEMO: JournalAction[] = [
  { id: 'action-demo-1', date: '2026-11-14T09:13:00Z', titre: 'Planifier le semis du manioc', parcelleId: 'tchibanga', statut: 'executee' },
  { id: 'action-demo-2', date: '2026-11-12T16:45:00Z', titre: 'Programmer un rappel de traitement', parcelleId: 'mouila', statut: 'annulee' },
]
