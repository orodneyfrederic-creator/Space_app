'use client'
// Amendements apportés au sol (chaux, compost, fumier, engrais…) : formulaire + liste.
import { useState, type FormEvent } from 'react'
import { enregistrerAmendement, ErreurApi } from '@/lib/api'
import { dateFr, nombreFr } from '@/lib/fiche'
import { libelleAmendement, TYPES_AMENDEMENT } from '@/lib/sols'
import type { Amendement, Site, TypeAmendement } from '@/lib/types'
import { CHAMP, ETIQUETTE } from './FormAnalyse'

const aujourdhui = () => new Date().toISOString().slice(0, 10)

export function ListeAmendements({ amendements }: { amendements: Amendement[] }) {
  if (amendements.length === 0) {
    return <p className="m-0 rounded-[14px] bg-paper p-4 text-sm text-muted">Aucun amendement enregistré pour ce site.</p>
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {amendements.map((a) => (
        <li key={a.id} className="flex flex-col gap-1 rounded-[14px] bg-paper px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold">{libelleAmendement(a.type)}</span>
            <span className="text-xs text-muted">
              {dateFr(a.date)} {a.date.slice(0, 4)}
              {a.parcelle ? ` · ${a.parcelle}` : ''}
            </span>
          </div>
          {(a.produit || a.quantite !== null) && (
            <span className="text-sm">
              {a.produit}
              {a.produit && a.quantite !== null ? ' · ' : ''}
              {a.quantite !== null && <span className="font-mono">{nombreFr(a.quantite, 2)} {a.unite ?? ''}</span>}
            </span>
          )}
          {a.notes && <span className="text-sm text-muted-2">{a.notes}</span>}
        </li>
      ))}
    </ul>
  )
}

export function FormAmendement({ site, onCree }: { site: Site; onCree: (a: Amendement) => void }) {
  const [type, setType] = useState<TypeAmendement>('chaux')
  const [date, setDate] = useState(aujourdhui)
  const [parcelle, setParcelle] = useState('')
  const [produit, setProduit] = useState('')
  const [quantite, setQuantite] = useState('')
  const [unite, setUnite] = useState('kg')
  const [notes, setNotes] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function soumettre(e: FormEvent) {
    e.preventDefault()
    setErreur(null)
    const brut = quantite.trim().replace(',', '.')
    const q = brut ? Number(brut) : null
    if (q !== null && (!Number.isFinite(q) || q < 0)) return setErreur('Quantité : entrez un nombre positif.')
    setEnvoi(true)
    try {
      onCree(
        await enregistrerAmendement({
          siteId: site.id,
          parcelle: parcelle.trim() || null,
          date,
          type,
          produit: produit.trim() || null,
          quantite: q,
          unite: q !== null ? unite.trim() || null : null,
          notes: notes.trim() || null,
        }),
      )
      setProduit('')
      setQuantite('')
      setNotes('')
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Une erreur inattendue est survenue.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-3" aria-label="Nouvel amendement" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={ETIQUETTE}>
          Type d&apos;apport
          <select className={CHAMP} value={type} onChange={(e) => setType(e.target.value as TypeAmendement)}>
            {TYPES_AMENDEMENT.map((t) => (
              <option key={t.valeur} value={t.valeur}>{t.libelle}</option>
            ))}
          </select>
        </label>
        <label className={ETIQUETTE}>
          Date de l&apos;apport
          <input type="date" className={CHAMP} value={date} max={aujourdhui()} min="1990-01-01" onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className={ETIQUETTE}>
          Produit <span className="text-xs font-normal text-muted">facultatif</span>
          <input className={CHAMP} value={produit} maxLength={100} onChange={(e) => setProduit(e.target.value)} placeholder="ex. NPK 15-15-15" />
        </label>
        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <label className={ETIQUETTE}>
            Quantité <span className="text-xs font-normal text-muted">facultatif</span>
            <input inputMode="decimal" className={`${CHAMP} font-mono`} value={quantite} onChange={(e) => setQuantite(e.target.value)} />
          </label>
          <label className={ETIQUETTE}>
            Unité
            <input className={CHAMP} value={unite} maxLength={30} onChange={(e) => setUnite(e.target.value)} list="unites-apport" />
            <datalist id="unites-apport">
              {['kg', 'sacs', 'brouettes', 'tonnes', 'litres'].map((u) => <option key={u} value={u} />)}
            </datalist>
          </label>
        </div>
        <label className={ETIQUETTE}>
          Parcelle <span className="text-xs font-normal text-muted">facultatif</span>
          <input className={CHAMP} value={parcelle} maxLength={80} onChange={(e) => setParcelle(e.target.value)} />
        </label>
        <label className={ETIQUETTE}>
          Notes <span className="text-xs font-normal text-muted">facultatif</span>
          <input className={CHAMP} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
      {erreur && <p role="alert" className="m-0 rounded-xl bg-risk-bg px-3 py-2 text-sm text-risk">{erreur}</p>}
      <button
        type="submit"
        disabled={envoi}
        className="min-h-12 cursor-pointer rounded-xl border-none bg-accent px-5 font-sans text-[15px] font-semibold text-white hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60 sm:self-start"
      >
        {envoi ? 'Enregistrement…' : 'Enregistrer l’apport'}
      </button>
    </form>
  )
}
