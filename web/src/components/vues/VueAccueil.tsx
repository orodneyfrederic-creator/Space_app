'use client'
// Accueil / tableau de bord : les vrais chiffres NASA du site choisi, et l'aperçu de tous les sites.
// Ordinateur : 2 colonnes (conditions + évaluation à gauche ; mini-carte + sites à droite).
import Link from 'next/link'
import { getApercu, getFiche } from '@/lib/api'
import { dateFr, ecartFr, LIBELLE_SOL, lireFiche, nombreFr } from '@/lib/fiche'
import { useSiteChoisi } from '@/lib/site-choisi'
import { useApi } from '@/lib/use-api'
import { styleVerdict } from '@/lib/verdict'
import BoutonVisite from '../aide/BoutonVisite'
import { Infobulle } from '../aide/Infobulle'
import CarteParcelles from '../carte/CarteParcelles'
import { SunIcon } from '../icons'
import SelecteurSite from '../SelecteurSite'
import CarteTelegram from '../telegram/CarteTelegram'
import { BadgeVerdict, Chargement, EnTetePage, Erreur, EtiquetteNasa, Panneau, Tuile } from '../ui/elements'

export default function VueAccueil() {
  const [siteId, choisir] = useSiteChoisi()
  const fiche = useApi(() => getFiche(siteId), `fiche:${siteId}`)
  const apercu = useApi(getApercu, 'apercu')

  const lue = fiche.statut === 'pret' ? lireFiche(fiche.donnees.fiche.donnees) : null
  const nomSite = fiche.statut === 'pret' ? fiche.donnees.site.nom : apercu.statut === 'pret' ? apercu.donnees.find((a) => a.site.id === siteId)?.site.nom : undefined

  return (
    <>
      <EnTetePage
        titre={nomSite ?? 'Tableau de bord'}
        sousTitre={lue?.dernierJour ? `Données NASA POWER jusqu'au ${dateFr(lue.dernierJour)}` : 'Conseils de semis à partir des données NASA'}
        actions={
          <>
            <BoutonVisite className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 font-sans text-[15px] font-semibold text-accent hover:border-accent" />
            <SelecteurSite />
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-6">
        {/* Colonne gauche : conditions + évaluation */}
        <div className="flex min-w-0 flex-col gap-5">
          {fiche.statut === 'chargement' && <Chargement hauteur="h-72" />}
          {fiche.statut === 'erreur' && <Erreur message={fiche.message} onReessayer={fiche.recharger} />}
          {lue && (
            <>
              <BandeauVerdict verdict={lue.verdict} raison={lue.raison} />
              <div data-visite="conditions" className="min-w-0">
              <Panneau
                titre="Conditions actuelles"
                etiquette={
                  <span className="flex items-center gap-1">
                    <EtiquetteNasa />
                    <Infobulle sujet="nasa" />
                  </span>
                }
              >
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                  <Tuile libelle="Pluie 7 jours" valeur={nombreFr(lue.pluie7)} unite="mm" detail={`${ecartFr(lue.ecart7)} vs normale`} aide={<Infobulle sujet="pluie7" />} />
                  <Tuile libelle="Pluie 30 jours" valeur={nombreFr(lue.pluie30)} unite="mm" detail={`${ecartFr(lue.ecart30)} vs normale`} aide={<Infobulle sujet="pluie30" />} />
                  <div className="flex flex-col gap-1 rounded-[14px] bg-paper p-3.5">
                    <span className="flex min-h-6 items-center justify-between gap-1 text-xs text-muted">
                      Humidité du sol
                      <Infobulle sujet="solHumidite" />
                    </span>
                    <span className="font-display text-lg leading-tight font-semibold">{LIBELLE_SOL[lue.etatSol]}</span>
                  </div>
                  <Tuile libelle="Temp. max (7 j)" valeur={nombreFr(lue.tmax7)} unite="°C" aide={<Infobulle sujet="tmax" />} />
                </div>
                <p className="m-0 flex flex-wrap items-center gap-x-1 text-sm text-muted-2">
                  <strong className="font-semibold text-ink">Saison des pluies : </strong>
                  {lue.demarrage?.statut === 'demarree'
                    ? `démarrée le ${dateFr(lue.demarrage.date)}`
                    : lue.demarrage?.statut === 'pas_encore'
                      ? 'pas encore démarrée'
                      : 'indisponible'}
                  <Infobulle sujet="saison" />
                </p>
                <Link href="/donnees" className="flex min-h-11 items-center self-start text-sm font-semibold text-accent no-underline hover:text-accent-hover">
                  Voir le détail des données →
                </Link>
              </Panneau>
              </div>
            </>
          )}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Link
              href="/discuter"
              className="flex min-h-14 items-center justify-center rounded-2xl bg-accent px-4 text-base font-semibold text-white no-underline hover:bg-accent-hover"
            >
              Poser une question à l&apos;agent
            </Link>
            <Link
              href="/cultures"
              className="flex min-h-14 items-center justify-center rounded-2xl border border-line bg-surface px-4 text-base font-semibold text-ink no-underline hover:border-accent"
            >
              Que planter cette saison ?
            </Link>
          </div>
          <CarteTelegram />
        </div>

        {/* Colonne droite : mini-carte + sites suivis */}
        <div className="flex min-w-0 flex-col gap-5">
          {apercu.statut === 'chargement' && <Chargement texte="Chargement des 8 sites…" hauteur="h-72" />}
          {apercu.statut === 'erreur' && <Erreur message={apercu.message} onReessayer={apercu.recharger} />}
          {apercu.statut === 'pret' && (
            <div data-visite="sites" className="min-w-0">
            <Panneau titre="Sites suivis" etiquette={<Link href="/carte" className="text-sm font-semibold text-accent no-underline hover:text-accent-hover">Carte complète</Link>}>
              <CarteParcelles apercus={apercu.donnees} hauteur="h-64" compacte siteMisEnAvant={siteId} />
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {apercu.donnees.map((a) => (
                  <li key={a.site.id}>
                    <button
                      type="button"
                      onClick={() => choisir(a.site.id)}
                      aria-pressed={a.site.id === siteId}
                      className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2 text-left font-sans ${
                        a.site.id === siteId ? 'border-accent bg-accent-soft' : 'border-transparent bg-paper hover:border-line'
                      }`}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[15px] font-semibold text-ink">{a.site.nom}</span>
                        <span className="font-mono text-xs text-muted">
                          {a.pluie30 === null ? 'pluie indisponible' : `${nombreFr(a.pluie30)} mm / 30 j · ${ecartFr(a.ecart30)}`}
                        </span>
                      </span>
                      <BadgeVerdict verdict={a.verdict} />
                    </button>
                  </li>
                ))}
              </ul>
            </Panneau>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function BandeauVerdict({ verdict, raison }: { verdict: ReturnType<typeof lireFiche>['verdict']; raison: string | null }) {
  const s = styleVerdict(verdict)
  const titre =
    verdict === 'favorable' ? 'Bon moment pour semer' : verdict === 'risquée' ? 'Semis risqué en ce moment' : verdict === 'défavorable' ? 'Mieux vaut attendre pour semer' : 'Évaluation indisponible'
  return (
    <div role="note" data-visite="verdict" className={`flex items-start gap-3 rounded-2xl px-4 py-4 ${s.badge}`}>
      <SunIcon />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="m-0 flex items-center justify-between gap-2 font-display text-base font-semibold">
          {titre}
          <Infobulle sujet="verdict" />
        </p>
        <p className="m-0 text-sm leading-[1.45]">{raison ? `${raison.charAt(0).toUpperCase()}${raison.slice(1)}.` : 'Données NASA manquantes.'}</p>
      </div>
    </div>
  )
}
