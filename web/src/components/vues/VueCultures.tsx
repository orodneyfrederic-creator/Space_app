'use client'
// Cultures : la fenêtre de semis réelle du site choisi, et des questions prêtes à poser à l'agent pour chaque culture.
// Aucun score inventé : les repères viennent des fiches de connaissances de l'équipe (knowledge/fiches), encore à valider.
import Link from 'next/link'
import { getFiche } from '@/lib/api'
import { CULTURES, lienQuestion } from '@/lib/cultures'
import { lireFiche } from '@/lib/fiche'
import { useSiteChoisi } from '@/lib/site-choisi'
import { useApi } from '@/lib/use-api'
import SelecteurSite from '../SelecteurSite'
import { BadgeVerdict, Chargement, EnTetePage, Erreur, Panneau } from '../ui/elements'

export default function VueCultures() {
  const [siteId] = useSiteChoisi()
  const fiche = useApi(() => getFiche(siteId), `fiche:${siteId}`)
  const lue = fiche.statut === 'pret' ? lireFiche(fiche.donnees.fiche.donnees) : null

  return (
    <>
      <EnTetePage titre="Cultures" sousTitre="Repères par culture et questions à poser à l'agent" actions={<SelecteurSite />} />
      <div className="mb-5">
        {fiche.statut === 'chargement' && <Chargement texte="Évaluation de la fenêtre de semis…" hauteur="h-28" />}
        {fiche.statut === 'erreur' && <Erreur message={fiche.message} onReessayer={fiche.recharger} />}
        {fiche.statut === 'pret' && lue && (
          <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-surface p-5">
            <span className="font-display text-base font-semibold">Fenêtre de semis à {fiche.donnees.site.nom} :</span>
            <BadgeVerdict verdict={lue.verdict} taille="grande" />
            {lue.raison && <span className="text-sm text-muted-2">{lue.raison}</span>}
          </div>
        )}
      </div>
      <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 lg:gap-6">
        {CULTURES.map((c) => (
          <li key={c.nom} className="flex">
            <Panneau titre={c.nom} etiquette={<span className="rounded-full bg-line-soft px-2.5 py-1 text-[11px] font-semibold text-muted-2">repère à valider</span>} className="w-full">
              <p className="m-0 text-sm leading-relaxed text-muted-2">{c.repere}</p>
              <div className="mt-auto flex flex-col gap-2">
                {c.questions.map((q) => (
                  <Link
                    key={q}
                    href={lienQuestion(q)}
                    className="flex min-h-11 items-center rounded-xl border border-line px-3.5 py-2 text-sm font-medium text-ink no-underline hover:border-accent hover:bg-accent-soft"
                  >
                    {q} →
                  </Link>
                ))}
              </div>
            </Panneau>
          </li>
        ))}
      </ul>
      <p className="mt-5 mb-0 text-xs text-muted">Repères tirés des fiches de connaissances S&apos;STACK, à faire valider par un agronome ou un producteur.</p>
    </>
  )
}
