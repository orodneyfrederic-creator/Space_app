'use client'
// MODULE 06 — Assistant intelligent (/assistant) : logique côté site.
// Les réponses viennent du vrai agent (POST /api/conseil et /api/voix). Ce fichier :
//  - décrit ce que l'agent a consulté, à partir de la fiche réellement renvoyée (aucune valeur inventée) ;
//  - propose une action quand c'est utile ; elle n'est enregistrée qu'après confirmation ;
//  - garde le journal des actions dans le navigateur, en attendant les tables ai_* côté serveur
//    (supabase/migrations/003_assistant_ia.sql).
// Ces types sont propres au site : ils ne font PAS partie du contrat d'API (lib/types.ts).
import { useSyncExternalStore } from 'react'
import { dateFr, lireFiche, nombreFr } from './fiche'
import type { ReponseAgent, Site } from './types'
import { styleVerdict } from './verdict'

// ── Pièces jointes ──
export const TYPES_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
export const TAILLE_MAX = 10 * 1024 * 1024 // 10 Mo

/** Message d'erreur si le fichier ne convient pas, sinon null. */
export function verifierFichier(f: File): string | null {
  if (!(TYPES_ACCEPTES as readonly string[]).includes(f.type)) return 'Format non accepté : photo (JPEG, PNG, WebP) ou PDF.'
  if (f.size > TAILLE_MAX) return 'Fichier trop lourd : 10 Mo maximum.'
  return null
}

export type PieceJointe = { nom: string; type: string; apercuUrl?: string }

// ── Messages ──
/** Une source réellement consultée par l'agent pour répondre (lue dans la fiche renvoyée). */
export type Consultation = { libelle: string; detail: string }

export type StatutAction = 'proposee' | 'enregistree' | 'annulee'

export type ActionProposee = {
  id: string
  type: 'rappel_semis' | 'reverifier'
  titre: string
  siteId: string
  details: { label: string; valeur: string }[]
  statut: StatutAction
}

export type MessageAssistant =
  | { id: string; role: 'moi'; texte: string; vocal?: boolean; pieceJointe?: PieceJointe }
  | {
      id: string
      role: 'agent'
      texte: string
      consultations: Consultation[]
      hypothese: boolean // diagnostic à partir d'une photo ou d'une description : à vérifier
      noteJointe?: string
      action?: ActionProposee
    }
  | { id: string; role: 'erreur'; texte: string }

let compteur = 0
export const nouvelId = (prefixe: string) => `${prefixe}-${Date.now().toString(36)}-${compteur++}`

/** Ce que l'agent a consulté, d'après la fiche renvoyée par le serveur. */
export function consultations(r: ReponseAgent, site: Site): Consultation[] {
  const f = lireFiche(r.fiche.donnees)
  const liste: Consultation[] = [
    {
      libelle: `Fiche du site ${site.nom}`,
      detail: f.dernierJour ? `NASA POWER, données jusqu'au ${dateFr(f.dernierJour)}` : 'NASA POWER : données indisponibles',
    },
    {
      libelle: 'Verdict de semis calculé',
      detail: f.verdict ? `${styleVerdict(f.verdict).libelle}${f.raison ? ` : ${f.raison}` : ''}` : 'indisponible',
    },
  ]
  if (f.pluie30 !== null) liste.push({ libelle: 'Pluie des 30 derniers jours', detail: `${nombreFr(f.pluie30)} mm` })
  if (f.sol) liste.push({ libelle: 'Sol (SoilGrids)', detail: `pH ${nombreFr(f.sol.ph)}, argile ${nombreFr(f.sol.argile, 0)} %` })
  liste.push({ libelle: 'Rédaction de la réponse', detail: r.modele || r.fournisseur })
  return liste
}

// ── Actions proposées ──
const sansAccents = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const CULTURES = ['manioc', 'plantain', 'banane', 'arachide', 'mais', 'taro', 'igname'] as const

function dansJours(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/**
 * Une action à proposer après une question sur le semis, selon le verdict CALCULÉ par le serveur.
 * Favorable → rappel de semis ; risquée ou défavorable → revérifier dans 3 jours. Sinon rien.
 */
export function proposerAction(question: string, r: ReponseAgent, site: Site): ActionProposee | undefined {
  const q = sansAccents(question)
  if (!/\b(sem|plant|bouture)/.test(q)) return undefined
  const { verdict } = lireFiche(r.fiche.donnees)
  if (!verdict) return undefined
  const culture = CULTURES.find((c) => q.includes(c))
  const nomCulture = culture === 'mais' ? 'maïs' : culture
  const base = { id: nouvelId('action'), siteId: site.id, statut: 'proposee' as const }
  if (verdict === 'favorable') {
    return {
      ...base,
      type: 'rappel_semis',
      titre: nomCulture ? `Rappel : semer le ${nomCulture}` : 'Rappel : semer',
      details: [
        { label: 'Site', valeur: site.nom },
        { label: 'Verdict actuel', valeur: styleVerdict(verdict).libelle },
        { label: 'Date proposée', valeur: dansJours(1) },
      ],
    }
  }
  return {
    ...base,
    type: 'reverifier',
    titre: 'Revérifier le verdict de semis',
    details: [
      { label: 'Site', valeur: site.nom },
      { label: 'Verdict actuel', valeur: styleVerdict(verdict).libelle },
      { label: 'À revoir le', valeur: dansJours(3) },
    ],
  }
}

// ── Journal des actions (navigateur, en attendant la table ai_action_logs) ──
export type LigneJournal = { id: string; date: string; titre: string; siteId: string; statut: Exclude<StatutAction, 'proposee'> }

const CLE_JOURNAL = 'sstack:journal-actions'
const EVENEMENT_JOURNAL = 'sstack:journal-actions'
const VIDE: LigneJournal[] = []
let dernierBrut: string | null = null
let dernierJournal: LigneJournal[] = VIDE

function lireJournal(): LigneJournal[] {
  let brut: string | null
  try {
    brut = window.localStorage.getItem(CLE_JOURNAL)
  } catch {
    return dernierJournal // stockage bloqué : journal en mémoire seulement
  }
  if (brut === dernierBrut) return dernierJournal
  dernierBrut = brut
  try {
    const v: unknown = JSON.parse(brut ?? '[]')
    dernierJournal = Array.isArray(v) ? (v as LigneJournal[]) : VIDE
  } catch {
    dernierJournal = VIDE
  }
  return dernierJournal
}

export function ajouterAuJournal(ligne: LigneJournal) {
  const suivant = [ligne, ...lireJournal()].slice(0, 100)
  try {
    window.localStorage.setItem(CLE_JOURNAL, JSON.stringify(suivant))
  } catch {
    dernierBrut = JSON.stringify(suivant)
    dernierJournal = suivant
  }
  window.dispatchEvent(new Event(EVENEMENT_JOURNAL))
}

function abonner(rappel: () => void) {
  window.addEventListener(EVENEMENT_JOURNAL, rappel)
  window.addEventListener('storage', rappel)
  return () => {
    window.removeEventListener(EVENEMENT_JOURNAL, rappel)
    window.removeEventListener('storage', rappel)
  }
}

export function useJournalActions(): LigneJournal[] {
  return useSyncExternalStore(abonner, lireJournal, () => VIDE)
}
