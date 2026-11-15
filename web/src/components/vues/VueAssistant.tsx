'use client'
// MODULE 06 — Assistant intelligent : discussion avec l'agent (texte, voix, photo), sources consultées,
// actions à confirmer, et onglet « Historique » (conversations + journal des actions).
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { getSites } from '@/lib/api'
import { useSiteChoisi } from '@/lib/site-choisi'
import { useApi } from '@/lib/use-api'
import FenetreAssistant from '../assistant/FenetreAssistant'
import HistoriqueAssistant from '../assistant/HistoriqueAssistant'
import SelecteurSite from '../SelecteurSite'
import { Chargement, EnTetePage, Erreur } from '../ui/elements'

type Onglet = 'discussion' | 'historique'

export default function VueAssistant() {
  const [siteId] = useSiteChoisi()
  const sites = useApi(getSites, 'sites')
  const questionInitiale = useSearchParams().get('question') ?? ''
  const [onglet, setOnglet] = useState<Onglet>('discussion')
  const site = sites.statut === 'pret' ? sites.donnees.find((s) => s.id === siteId) : undefined

  return (
    <div className="mx-auto w-full max-w-[860px]">
      <EnTetePage
        titre="Assistant intelligent"
        sousTitre="Il connaît votre site, consulte les données NASA et vous propose des actions"
        actions={<SelecteurSite />}
      />

      <div role="tablist" aria-label="Affichage" className="mb-4 grid max-w-sm grid-cols-2 gap-1.5 rounded-[14px] bg-segmented p-1">
        {(['discussion', 'historique'] as const).map((o) => (
          <button
            key={o}
            type="button"
            role="tab"
            aria-selected={onglet === o}
            onClick={() => setOnglet(o)}
            className={`min-h-11 cursor-pointer rounded-[10px] border-none font-sans text-sm font-semibold ${
              onglet === o ? 'bg-surface text-ink shadow-[0_1px_2px_rgba(0,0,0,0.08)]' : 'bg-transparent text-muted'
            }`}
          >
            {o === 'discussion' ? 'Discussion' : 'Historique'}
          </button>
        ))}
      </div>

      {sites.statut === 'chargement' && <Chargement texte="Préparation de l'assistant…" hauteur="h-96" />}
      {sites.statut === 'erreur' && <Erreur message={sites.message} onReessayer={sites.recharger} />}
      {sites.statut === 'pret' && !site && <Erreur message="Site inconnu : choisissez un site dans la liste." />}

      {/* La discussion reste montée quand on regarde l'historique ; key : nouvelle discussion si le site change */}
      {site && (
        <div hidden={onglet !== 'discussion'}>
          <FenetreAssistant key={site.id} site={site} questionInitiale={questionInitiale} />
        </div>
      )}
      {sites.statut === 'pret' && onglet === 'historique' && <HistoriqueAssistant sites={sites.donnees} />}
    </div>
  )
}
