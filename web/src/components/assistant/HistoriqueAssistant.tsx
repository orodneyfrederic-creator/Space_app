'use client'
// Onglet « Historique » de l'assistant : conversations (conseils web et Telegram, lus sur le serveur)
// et journal des actions confirmées ou annulées (gardé sur cet appareil).
import Link from 'next/link'
import { useJournalActions } from '@/lib/assistant'
import { listerConseils } from '@/lib/api'
import type { Site } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import ListeConseils from '../historique/ListeConseils'
import { Chargement, Erreur } from '../ui/elements'
import { STATUTS } from './CarteAction'

const dateCourte = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

export default function HistoriqueAssistant({ sites }: { sites: Site[] }) {
  const conseils = useApi(() => listerConseils(10), 'conseils:10')
  const journal = useJournalActions()
  const nomSite = (id: string) => sites.find((s) => s.id === id)?.nom ?? id

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="hist-actions" className="flex flex-col gap-2.5">
        <h2 id="hist-actions" className="m-0 font-display text-lg font-semibold">Journal des actions</h2>
        {journal.length === 0 ? (
          <p className="m-0 rounded-2xl bg-surface p-4 text-sm text-muted">
            Aucune action pour le moment. Quand l&apos;assistant propose un rappel, il apparaît ici après votre réponse.
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {journal.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 rounded-[18px] bg-surface px-4 py-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-semibold">{a.titre}</span>
                  <span className="text-xs text-muted">
                    {nomSite(a.siteId)} · {dateCourte(a.date)}
                  </span>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUTS[a.statut].classe}`}>
                  {STATUTS[a.statut].label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="hist-conv" className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="hist-conv" className="m-0 font-display text-lg font-semibold">Dernières conversations</h2>
          <Link href="/historique" className="text-sm font-semibold text-accent no-underline hover:text-accent-hover">
            Tout voir
          </Link>
        </div>
        {conseils.statut === 'chargement' && <Chargement texte="Chargement de l'historique…" />}
        {conseils.statut === 'erreur' && <Erreur message={conseils.message} onReessayer={conseils.recharger} />}
        {conseils.statut === 'pret' && <ListeConseils conseils={conseils.donnees} compacte />}
      </section>
    </div>
  )
}
