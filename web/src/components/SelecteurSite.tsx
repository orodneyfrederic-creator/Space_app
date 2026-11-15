'use client'
// Liste déroulante des sites connus (vient de /api/sites). Le choix est mémorisé pour toutes les pages.
import { getSites } from '@/lib/api'
import { useSiteChoisi } from '@/lib/site-choisi'
import { useApi } from '@/lib/use-api'
import { Infobulle } from './aide/Infobulle'

export default function SelecteurSite() {
  const [siteId, choisir] = useSiteChoisi()
  const sites = useApi(getSites, 'sites')
  const options = sites.statut === 'pret' ? sites.donnees : []

  return (
    <div data-visite="site" className="flex items-center gap-1">
    <label className="flex items-center gap-2 text-sm text-muted-2">
      <span className="font-medium">Site</span>
      <select
        value={siteId}
        onChange={(e) => choisir(e.target.value)}
        disabled={options.length === 0}
        className="min-h-11 max-w-[16rem] cursor-pointer rounded-xl border border-line bg-surface px-3 font-sans text-[15px] text-ink disabled:cursor-wait"
      >
        {options.length === 0 && <option value={siteId}>{sites.statut === 'erreur' ? 'Sites indisponibles' : 'Chargement…'}</option>}
        {options.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nom}
          </option>
        ))}
      </select>
    </label>
    <Infobulle sujet="site" />
    </div>
  )
}
