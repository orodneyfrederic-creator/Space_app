'use client'
// « Étape suivante » : une seule carte en bas de chaque page, qui mène à la page suivante du parcours.
// Producteur : Dashboard → Mes graphiques → Mon sol → Mes cultures → Mbolo → Mes conseils → Dashboard.
// Conseiller et organisation : la carte des sites et l'historique climatique s'ajoutent dans « Comprendre ».
// Posée une seule fois dans app/(app)/layout.tsx : aucune page n'a besoin de la connaître.
// Suspense : usePathname n'est connu qu'au moment de la requête (Next.js 16).
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { useProfil } from '@/lib/profil'
import type { Profil } from '@/lib/types'
import { NOM_AGENT } from '../agent/questions'
import { ETAPES_PARCOURS } from './menu'

type Suite = { question: string; titre: string; texte: string; href: string }

const DASHBOARD: Suite = { question: 'Prêt pour la semaine ?', titre: 'Revenir au dashboard', texte: 'La décision de la semaine pour votre champ.', href: '/tableau-de-bord' }
const GRAPHIQUES: Suite = { question: 'Pourquoi ce conseil ?', titre: 'Voir mes graphiques', texte: 'La pluie, l’eau dans la terre et la chaleur des 30 derniers jours, en mots simples.', href: '/graphiques' }
const SOL: Suite = { question: 'Et ma terre à moi ?', titre: 'Mon sol', texte: 'Vos analyses de terre et ce que vous y avez apporté.', href: '/soil' }
const CULTURES: Suite = { question: 'Que planter maintenant ?', titre: 'Mes cultures', texte: 'Les bons moments pour chaque culture.', href: '/cultures' }
const MBOLO: Suite = { question: 'Une question sur votre culture ?', titre: `Demander à ${NOM_AGENT}`, texte: 'À l’écrit ou à la voix, avec vos mots.', href: '/assistant' }
const CONSEILS: Suite = { question: 'Retrouver vos réponses ?', titre: 'Mes conseils', texte: 'Tout ce qui vous a été conseillé, sur le site et sur Telegram.', href: '/historique' }
const CARTE: Suite = { question: 'Où sont les zones à risque ?', titre: 'Carte des sites', texte: 'Tous les sites suivis et leur verdict, sur la carte.', href: '/carte' }
const HISTORIQUE: Suite = { question: 'Et par rapport à d’habitude ?', titre: 'Historique climatique', texte: 'La pluie des 30 derniers jours comparée à la normale.', href: '/donnees' }

/** Page courante (préfixe du chemin) → étape suivante, selon le profil. */
function suitePour(chemin: string, profil: Profil): Suite | null {
  const pro = profil !== 'producteur'
  const commence = (p: string) => chemin === p || chemin.startsWith(`${p}/`)
  if (commence('/tableau-de-bord')) return pro ? CARTE : GRAPHIQUES
  if (commence('/carte') || commence('/parcelles')) return GRAPHIQUES
  if (commence('/graphiques')) return pro ? HISTORIQUE : SOL
  if (commence('/donnees')) return SOL
  if (commence('/soil')) return CULTURES
  if (commence('/cultures')) return MBOLO
  if (commence('/assistant') || commence('/discuter')) return CONSEILS
  if (commence('/historique')) return DASHBOARD
  return null // paramètres, pages à venir, aide : pas de suite imposée
}

/** Numéro et nom de l'étape qui contient une adresse (pour « Étape 2 · Comprendre »). */
function etapeDe(href: string) {
  return ETAPES_PARCOURS.find((e) => e.entrees.some((p) => p.href === href))
}

function Carte({ chemin }: { chemin: string | null }) {
  const profil = useProfil()
  const suite = chemin ? suitePour(chemin, profil) : null
  if (!suite) return null
  const etape = etapeDe(suite.href)
  return (
    <nav aria-label="Étape suivante" className="mt-10">
      <Link
        href={suite.href}
        className="group flex items-center gap-4 rounded-3xl border border-line bg-surface px-5 py-5 no-underline transition-colors hover:border-accent sm:px-6"
      >
        {etape && (
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-base font-semibold text-white">
            {etape.numero}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-muted-2">
            Étape suivante{etape ? ` · ${etape.titre}` : ''} — {suite.question}
          </span>
          <span className="font-display text-[19px] leading-tight font-semibold text-ink">{suite.titre}</span>
          <span className="text-[14px] text-muted-2">{suite.texte}</span>
        </span>
        <span aria-hidden="true" className="shrink-0 text-2xl text-accent transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none">
          →
        </span>
      </Link>
    </nav>
  )
}

function CarteAvecChemin() {
  return <Carte chemin={usePathname()} />
}

export default function EtapeSuivante() {
  return (
    <Suspense fallback={null}>
      <CarteAvecChemin />
    </Suspense>
  )
}
