// Résumé lisible de la fiche parcelle : pluie, sol, saison, verdict de la fenêtre de semis.
// TODO (front-end) : mise en forme (couleur selon le verdict : favorable / risquée / défavorable).
import type { DonneesFiche } from '@/lib/types'

export default function CarteFiche({ fiche }: { fiche: DonneesFiche }) {
  return (
    <div className="rounded-xl border p-4 text-sm">
      <p className="font-semibold">Fenêtre de semis : {fiche.evaluation.verdict}</p>
      <p>{fiche.evaluation.raison}</p>
      <ul className="mt-2">
        <li>Pluie 30 jours : {fiche.pluie30} mm (normale {fiche.normale30} mm)</li>
        <li>Pluie 7 jours : {fiche.pluie7} mm (normale {fiche.normale7} mm)</li>
        <li>Sol : {fiche.etatSol}</li>
        {fiche.solTexture && (
          <li>
            Texture : argile {fiche.solTexture.argile} %, sable {fiche.solTexture.sable} %, pH {fiche.solTexture.ph}
          </li>
        )}
      </ul>
      <p className="mt-2 text-xs">Données NASA POWER jusqu&apos;au {fiche.dernierJour}</p>
    </div>
  )
}
