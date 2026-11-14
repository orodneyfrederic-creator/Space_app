'use client'
// Données NASA du site choisi : uniquement des chiffres calculés par le serveur (fiche parcelle).
import { getFiche } from '@/lib/api'
import { dateFr, ecartFr, LIBELLE_SOL, lireFiche, nombreFr } from '@/lib/fiche'
import { useSiteChoisi } from '@/lib/site-choisi'
import { useApi } from '@/lib/use-api'
import GraphiquePluie from '../climat/GraphiquePluie'
import SelecteurSite from '../SelecteurSite'
import { Chargement, EnTetePage, Erreur, EtiquetteNasa, Panneau, Tuile } from '../ui/elements'

export default function VueDonnees() {
  const [siteId] = useSiteChoisi()
  const fiche = useApi(() => getFiche(siteId), `fiche:${siteId}`)
  const lue = fiche.statut === 'pret' ? lireFiche(fiche.donnees.fiche.donnees) : null

  return (
    <>
      <EnTetePage
        titre="Données NASA"
        sousTitre={fiche.statut === 'pret' ? `${fiche.donnees.site.nom} · données jusqu'au ${dateFr(lue?.dernierJour ?? null)}` : 'Pluie, sol et saison du site choisi'}
        actions={<SelecteurSite />}
      />
      {fiche.statut === 'chargement' && <Chargement hauteur="h-80" />}
      {fiche.statut === 'erreur' && <Erreur message={fiche.message} onReessayer={fiche.recharger} />}
      {fiche.statut === 'pret' && lue && (
        <div className="flex flex-col gap-5 lg:gap-6">
          <Panneau titre="Pluie quotidienne (30 derniers jours)" etiquette={<EtiquetteNasa texte="PRECTOTCORR · mm" />}>
            <GraphiquePluie points={fiche.donnees.serie} hauteur={300} />
          </Panneau>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6 xl:grid-cols-3">
            <Panneau titre="Pluie">
              <div className="grid grid-cols-2 gap-2.5">
                <Tuile libelle="7 derniers jours" valeur={nombreFr(lue.pluie7)} unite="mm" detail={`normale ${nombreFr(lue.normale7)} mm`} />
                <Tuile libelle="Écart (7 j)" valeur={ecartFr(lue.ecart7)} />
                <Tuile libelle="30 derniers jours" valeur={nombreFr(lue.pluie30)} unite="mm" detail={`normale ${nombreFr(lue.normale30)} mm`} />
                <Tuile libelle="Écart (30 j)" valeur={ecartFr(lue.ecart30)} />
              </div>
            </Panneau>

            <Panneau titre="Sécheresse et chaleur">
              <div className="grid grid-cols-2 gap-2.5">
                <Tuile libelle="Jours secs (14 j)" valeur={nombreFr(lue.secs14, 0)} detail="moins de 1 mm" />
                <Tuile libelle="Plus longue suite sèche" valeur={nombreFr(lue.secheresse14, 0)} unite="j" />
                <Tuile libelle="Temp. max (7 j)" valeur={nombreFr(lue.tmax7)} unite="°C" />
              </div>
            </Panneau>

            <Panneau titre="Sol et saison" etiquette={<EtiquetteNasa texte="GWETROOT" />}>
              <div className="flex flex-col gap-1 rounded-[14px] bg-paper p-3.5">
                <span className="text-xs text-muted">Humidité au niveau des racines</span>
                <span className="font-display text-xl font-semibold">{LIBELLE_SOL[lue.etatSol]}</span>
                <span className="text-xs text-muted">habituellement ce mois-ci : {LIBELLE_SOL[lue.solNormal].toLowerCase()}</span>
              </div>
              <dl className="m-0 grid gap-2 text-sm">
                <div>
                  <dt className="font-semibold">Grande saison des pluies</dt>
                  <dd className="m-0 text-muted-2">
                    {lue.demarrage?.statut === 'demarree'
                      ? `Démarrée le ${dateFr(lue.demarrage.date)}${lue.demarrage.provisoire ? ' (provisoire)' : ''}`
                      : lue.demarrage?.statut === 'pas_encore'
                        ? `Pas encore démarrée (observée depuis le ${dateFr(lue.demarrage.depuis)})`
                        : 'Indisponible'}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Mois habituellement les plus secs</dt>
                  <dd className="m-0 text-muted-2">{lue.moisSecs.length ? lue.moisSecs.join(', ') : 'Indisponible'}</dd>
                </div>
                {lue.sol && (
                  <div>
                    <dt className="font-semibold">Sol (0–30 cm, SoilGrids)</dt>
                    <dd className="m-0 text-muted-2">
                      Argile {nombreFr(lue.sol.argile)} %, sable {nombreFr(lue.sol.sable)} %, pH {nombreFr(lue.sol.ph)}, carbone {nombreFr(lue.sol.carbone)} g/kg
                    </dd>
                  </div>
                )}
              </dl>
            </Panneau>
          </div>

          <p className="m-0 text-xs leading-normal text-muted">
            Sources : NASA POWER (PRECTOTCORR, T2M_MAX, GWETROOT ; normales mensuelles de long terme) et ISRIC SoilGrids (estimation à 250 m).
            Seuils d&apos;interprétation S&apos;STACK à valider par un agronome.
          </p>
        </div>
      )}
    </>
  )
}
