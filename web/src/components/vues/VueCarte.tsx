'use client'
// Carte des 8 sites : grande carte + liste des verdicts (à droite sur ordinateur, dessous sur téléphone).
import Link from 'next/link'
import { getApercu } from '@/lib/api'
import { dateFr, ecartFr, LIBELLE_SOL, nombreFr } from '@/lib/fiche'
import { useApi } from '@/lib/use-api'
import CarteParcelles, { LegendeCarte } from '../carte/CarteParcelles'
import { BadgeVerdict, Chargement, EnTetePage, Erreur } from '../ui/elements'

export default function VueCarte() {
  const apercu = useApi(getApercu, 'apercu')
  const dernierJour = apercu.statut === 'pret' ? (apercu.donnees.find((a) => a.dernierJour)?.dernierJour ?? null) : null

  return (
    <>
      <EnTetePage
        titre="Carte des sites"
        sousTitre={dernierJour ? `8 sites au Gabon · données NASA POWER jusqu'au ${dateFr(dernierJour)}` : '8 sites suivis au Gabon'}
        actions={<LegendeCarte />}
      />
      {apercu.statut === 'chargement' && <Chargement texte="Chargement des 8 sites…" hauteur="h-[60vh]" />}
      {apercu.statut === 'erreur' && <Erreur message={apercu.message} onReessayer={apercu.recharger} />}
      {apercu.statut === 'pret' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-6">
          <CarteParcelles apercus={apercu.donnees} hauteur="h-[55vh] min-h-[320px] lg:h-[calc(100dvh-12rem)] lg:min-h-[70vh]" />
          <ul className="m-0 flex list-none flex-col gap-2 p-0 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto">
            {apercu.donnees.map((a) => (
              <li key={a.site.id}>
                <Link
                  href={`/parcelles/${a.site.id}`}
                  className="flex min-h-16 flex-col gap-1.5 rounded-2xl bg-surface px-4 py-3 text-ink no-underline hover:ring-2 hover:ring-accent-light"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-display text-[15px] font-semibold">{a.site.nom}</span>
                    <BadgeVerdict verdict={a.verdict} />
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {a.pluie30 === null ? a.raison : `${nombreFr(a.pluie30)} mm / 30 j · ${ecartFr(a.ecart30)} · ${LIBELLE_SOL[a.etatSol].toLowerCase()}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
