// Résumé lisible de la fiche parcelle : verdict de semis, pluie, sol, saison. Uniquement des chiffres du serveur.
import { dateFr, ecartFr, LIBELLE_SOL, nombreFr, type FicheLue } from '@/lib/fiche'
import { BadgeVerdict, EtiquetteNasa, Panneau, Tuile } from '../ui/elements'

export default function CarteFiche({ fiche }: { fiche: FicheLue }) {
  return (
    <Panneau titre="Fenêtre de semis" etiquette={<BadgeVerdict verdict={fiche.verdict} taille="grande" />}>
      <p className="m-0 text-[15px] leading-relaxed text-muted-2">
        {fiche.raison ? `${fiche.raison.charAt(0).toUpperCase()}${fiche.raison.slice(1)}.` : 'Évaluation indisponible : données NASA manquantes.'}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <Tuile libelle="Pluie 30 jours" valeur={nombreFr(fiche.pluie30)} unite="mm" detail={`normale ${nombreFr(fiche.normale30)} mm · ${ecartFr(fiche.ecart30)}`} />
        <Tuile libelle="Pluie 7 jours" valeur={nombreFr(fiche.pluie7)} unite="mm" detail={`normale ${nombreFr(fiche.normale7)} mm · ${ecartFr(fiche.ecart7)}`} />
        <div className="flex flex-col gap-1 rounded-[14px] bg-paper p-3.5">
          <span className="text-xs text-muted">État du sol</span>
          <span className="font-display text-xl font-semibold">{LIBELLE_SOL[fiche.etatSol]}</span>
          <span className="text-xs text-muted">habituellement : {LIBELLE_SOL[fiche.solNormal].toLowerCase()}</span>
        </div>
        <Tuile libelle="Temp. max (7 jours)" valeur={nombreFr(fiche.tmax7)} unite="°C" />
      </div>
      <p className="m-0 text-sm text-muted-2">
        <strong className="font-semibold text-ink">Saison des pluies : </strong>
        {fiche.demarrage === null
          ? 'indisponible'
          : fiche.demarrage.statut === 'demarree'
            ? `démarrée le ${dateFr(fiche.demarrage.date)}${fiche.demarrage.provisoire ? ' (provisoire)' : ''}`
            : `pas encore démarrée (observée depuis le ${dateFr(fiche.demarrage.depuis)})`}
      </p>
      {fiche.sol && (
        <div className="flex flex-wrap gap-1.5" aria-label="Sol sur 0 à 30 cm (SoilGrids)">
          {[`Argile ${nombreFr(fiche.sol.argile)} %`, `Sable ${nombreFr(fiche.sol.sable)} %`, `pH ${nombreFr(fiche.sol.ph)}`, `Carbone ${nombreFr(fiche.sol.carbone)} g/kg`].map((t) => (
            <span key={t} className="rounded-full bg-risk-bg px-2.5 py-[5px] text-xs font-medium text-risk">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 text-xs text-muted">Données jusqu&apos;au {dateFr(fiche.dernierJour)} · règles S&apos;STACK à valider par un agronome</p>
        <EtiquetteNasa />
      </div>
    </Panneau>
  )
}
