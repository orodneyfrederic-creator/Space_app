'use client'
// Fiche d'un site : évaluation et chiffres à gauche, graphique de pluie à droite (sur ordinateur).
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getFiche } from '@/lib/api'
import { lireFiche } from '@/lib/fiche'
import { useSiteChoisi } from '@/lib/site-choisi'
import { useApi } from '@/lib/use-api'
import CarteFiche from '../climat/CarteFiche'
import GraphiquePluie from '../climat/GraphiquePluie'
import { Chargement, EnTetePage, Erreur, EtiquetteNasa, Panneau } from '../ui/elements'

export default function VueParcelle({ id }: { id: string }) {
  const fiche = useApi(() => getFiche(id), `fiche:${id}`)
  const [, choisir] = useSiteChoisi()
  const router = useRouter()

  const demanderConseil = () => {
    choisir(id)
    router.push('/discuter')
  }

  return (
    <>
      <Link href="/carte" className="mb-2 inline-flex min-h-11 items-center text-sm font-semibold text-accent no-underline hover:text-accent-hover">
        ← Carte des sites
      </Link>
      {fiche.statut === 'chargement' && <Chargement hauteur="h-80" />}
      {fiche.statut === 'erreur' && <Erreur message={fiche.message} onReessayer={fiche.recharger} />}
      {fiche.statut === 'pret' && (
        <>
          <EnTetePage
            titre={fiche.donnees.site.nom}
            sousTitre={<span className="font-mono text-xs">{fiche.donnees.site.lat}, {fiche.donnees.site.lon}</span>}
            actions={
              <button
                type="button"
                onClick={demanderConseil}
                className="min-h-12 cursor-pointer rounded-2xl border-none bg-accent px-5 text-[15px] font-semibold text-white hover:bg-accent-hover"
              >
                Demander conseil pour ce site
              </button>
            }
          />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            <CarteFiche fiche={lireFiche(fiche.donnees.fiche.donnees)} />
            <Panneau titre="Pluie des 30 derniers jours" etiquette={<EtiquetteNasa />} className="self-start">
              <GraphiquePluie points={fiche.donnees.serie} hauteur={320} />
            </Panneau>
          </div>
        </>
      )}
    </>
  )
}
