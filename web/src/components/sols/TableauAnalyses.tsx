// Comparaison des analyses dans le temps : une colonne par analyse (la plus récente à gauche),
// une ligne par propriété, avec l'écart par rapport à l'analyse précédente (même unité seulement).
import { dateFr } from '@/lib/fiche'
import { evolution, libelleMethode, libelleTypeSol, PROPRIETES, valeurFr } from '@/lib/sols'
import type { AnalyseSol } from '@/lib/types'

export default function TableauAnalyses({ analyses }: { analyses: AnalyseSol[] }) {
  if (analyses.length === 0) {
    return (
      <p className="m-0 rounded-[14px] bg-paper p-4 text-sm text-muted">
        Aucune analyse pour ce site. Ajoutez votre première analyse avec le formulaire.
      </p>
    )
  }
  const colonnes = analyses.slice(0, 6)
  return (
    <div className="overflow-x-auto rounded-[14px] border border-line-soft">
      {/* Largeur minimale selon le nombre de colonnes : le tableau défile dans son cadre, jamais la page */}
      <table className="w-full border-collapse text-sm" style={{ minWidth: 150 + 130 * colonnes.length }}>
        <caption className="sr-only">Comparaison des analyses de sol, de la plus récente à la plus ancienne</caption>
        <thead>
          <tr className="bg-paper text-left">
            <th scope="col" className="p-3 font-semibold">Propriété</th>
            {colonnes.map((a, i) => (
              <th key={a.id} scope="col" className="p-3 align-top font-semibold">
                <span className="block">
                  {dateFr(a.dateAnalyse)} {a.dateAnalyse.slice(0, 4)}
                </span>
                <span className="block text-xs font-normal text-muted">
                  {libelleMethode(a.methode)}
                  {a.parcelle ? ` · ${a.parcelle}` : ''}
                  {i === 0 ? ' · la plus récente' : ''}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-line-soft">
            <th scope="row" className="p-3 text-left font-medium">Type de sol</th>
            {colonnes.map((a) => (
              <td key={a.id} className="p-3">{libelleTypeSol(a.typeSol)}</td>
            ))}
          </tr>
          {PROPRIETES.map((p) => (
            <tr key={p.valeur} className="border-t border-line-soft">
              <th scope="row" className="p-3 text-left font-medium">{p.libelle}</th>
              {colonnes.map((a, i) => {
                const ecart = evolution(a, colonnes[i + 1], p.valeur)
                return (
                  <td key={a.id} className="p-3 font-mono">
                    {valeurFr(a, p.valeur)}
                    {ecart && ecart !== '=' && <span className="ml-1.5 text-xs text-muted">({ecart})</span>}
                  </td>
                )
              })}
            </tr>
          ))}
          <tr className="border-t border-line-soft">
            <th scope="row" className="p-3 text-left font-medium">Rapport</th>
            {colonnes.map((a) => (
              <td key={a.id} className="p-3">
                {a.document?.url ? (
                  <a href={a.document.url} target="_blank" rel="noreferrer" className="font-semibold text-accent">
                    {a.document.nom}
                  </a>
                ) : a.document ? (
                  <span className="text-muted">{a.document.nom} (lien indisponible)</span>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="m-0 border-t border-line-soft p-3 text-xs text-muted">
        « — » : non mesuré. Entre parenthèses : l&apos;écart avec l&apos;analyse précédente (même unité).
        {analyses.length > colonnes.length ? ` Les ${colonnes.length} analyses les plus récentes sont affichées.` : ''}
      </p>
    </div>
  )
}
