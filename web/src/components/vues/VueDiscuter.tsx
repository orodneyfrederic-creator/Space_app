'use client'
// Parler à l'agent : discussion centrée (~720 px) ; derniers conseils dans une colonne à droite sur grand écran.
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSites, listerConseils } from '@/lib/api'
import { useSiteChoisi } from '@/lib/site-choisi'
import { useApi } from '@/lib/use-api'
import FenetreDiscussion from '../discussion/FenetreDiscussion'
import ListeConseils from '../historique/ListeConseils'
import { ClockIcon } from '../icons'
import SelecteurSite from '../SelecteurSite'
import { Chargement, EnTetePage, Erreur } from '../ui/elements'

export default function VueDiscuter() {
  const [siteId] = useSiteChoisi()
  const sites = useApi(getSites, 'sites')
  const conseils = useApi(() => listerConseils(5), 'conseils:5')
  const questionInitiale = useSearchParams().get('question') ?? ''
  const site = sites.statut === 'pret' ? sites.donnees.find((s) => s.id === siteId) : undefined

  return (
    <>
      <EnTetePage
        titre="Parler à l'agent"
        sousTitre="Réponses fondées sur les données NASA du site choisi"
        actions={
          <>
            <SelecteurSite />
            <Link
              href="/historique"
              aria-label="Historique des conseils"
              title="Historique des conseils"
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-accent xl:hidden"
            >
              <ClockIcon />
            </Link>
          </>
        }
      />
      <div className="xl:grid xl:grid-cols-[minmax(0,720px)_minmax(0,1fr)] xl:gap-8">
        <div className="mx-auto w-full max-w-[720px] xl:mx-0">
          {sites.statut === 'chargement' && <Chargement texte="Préparation de l'agent…" hauteur="h-96" />}
          {sites.statut === 'erreur' && <Erreur message={sites.message} onReessayer={sites.recharger} />}
          {sites.statut === 'pret' && !site && <Erreur message="Site inconnu : choisissez un site dans la liste." />}
          {/* key : une nouvelle discussion quand on change de site */}
          {site && <FenetreDiscussion key={site.id} site={site} questionInitiale={questionInitiale} onConseil={conseils.recharger} />}
        </div>
        <aside className="hidden flex-col gap-3 xl:flex" aria-label="Derniers conseils">
          <div className="flex items-baseline justify-between">
            <h2 className="m-0 font-display text-lg font-semibold">Derniers conseils</h2>
            <Link href="/historique" className="text-sm font-semibold text-accent no-underline hover:text-accent-hover">
              Tout voir
            </Link>
          </div>
          {conseils.statut === 'chargement' && <Chargement texte="Chargement de l'historique…" />}
          {conseils.statut === 'erreur' && <Erreur message={conseils.message} onReessayer={conseils.recharger} />}
          {conseils.statut === 'pret' && <ListeConseils conseils={conseils.donnees} compacte />}
        </aside>
      </div>
    </>
  )
}
