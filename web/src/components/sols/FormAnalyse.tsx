'use client'
// Formulaire « Nouvelle analyse de sol » : seules les valeurs remplies sont enregistrées (le reste = non mesuré).
import { useRef, useState, type FormEvent } from 'react'
import { enregistrerAnalyseSol, ErreurApi } from '@/lib/api'
import { METHODES, PROPRIETES, TYPES_SOL } from '@/lib/sols'
import type { AnalyseSol, MesureSol, MethodeAnalyse, ProprieteSol, Site, TypeSol, UniteSol } from '@/lib/types'

const TYPES_DOC = ['application/pdf', 'image/jpeg', 'image/png']
const TAILLE_MAX = 10 * 1024 * 1024
const aujourdhui = () => new Date().toISOString().slice(0, 10)

export const CHAMP = 'min-h-11 w-full rounded-xl border border-line bg-paper px-3 font-sans text-[15px] text-ink'
export const ETIQUETTE = 'flex flex-col gap-1.5 text-sm font-medium'

type Saisie = Record<ProprieteSol, { valeur: string; unite: UniteSol }>
const saisieVide = (): Saisie =>
  Object.fromEntries(PROPRIETES.map((p) => [p.valeur, { valeur: '', unite: p.unites[0] }])) as Saisie

export default function FormAnalyse({ site, onCreee }: { site: Site; onCreee: (a: AnalyseSol) => void }) {
  const [parcelle, setParcelle] = useState('')
  const [date, setDate] = useState(aujourdhui)
  const [methode, setMethode] = useState<MethodeAnalyse>('laboratoire')
  const [laboratoire, setLaboratoire] = useState('')
  const [typeSol, setTypeSol] = useState<TypeSol | ''>('')
  const [saisie, setSaisie] = useState<Saisie>(saisieVide)
  const [document, setDocument] = useState<File | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState(false)
  const champDocument = useRef<HTMLInputElement>(null)

  const changer = (p: ProprieteSol, champ: 'valeur' | 'unite', v: string) =>
    setSaisie((s) => ({ ...s, [p]: { ...s[p], [champ]: v } }))

  function choisirDocument(f: File | undefined) {
    setErreur(null)
    if (!f) return setDocument(null)
    if (!TYPES_DOC.includes(f.type)) return setErreur('Document accepté : PDF, JPEG ou PNG.')
    if (f.size > TAILLE_MAX) return setErreur('Document trop lourd : 10 Mo au maximum.')
    setDocument(f)
  }

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(null)
    setSucces(false)
    const mesures: MesureSol[] = []
    for (const p of PROPRIETES) {
      const brut = saisie[p.valeur].valeur.trim().replace(',', '.')
      if (!brut) continue
      const valeur = Number(brut)
      if (!Number.isFinite(valeur) || valeur < 0) return setErreur(`${p.libelle} : entrez un nombre positif.`)
      if (p.valeur === 'ph' && valeur > 14) return setErreur('Le pH est compris entre 0 et 14.')
      mesures.push({ propriete: p.valeur, valeur, unite: saisie[p.valeur].unite })
    }
    if (mesures.length === 0 && !typeSol) return setErreur('Indiquez au moins une mesure ou le type de sol.')

    setEnvoi(true)
    try {
      const creee = await enregistrerAnalyseSol(
        {
          siteId: site.id,
          parcelle: parcelle.trim() || null,
          dateAnalyse: date,
          methode,
          laboratoire: laboratoire.trim() || null,
          typeSol: typeSol || null,
          mesures,
        },
        document ?? undefined,
      )
      onCreee(creee)
      setSaisie(saisieVide())
      setDocument(null)
      setLaboratoire('')
      setSucces(true)
      if (champDocument.current) champDocument.current.value = ''
    } catch (err) {
      setErreur(err instanceof ErreurApi ? err.message : 'Une erreur inattendue est survenue.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={soumettre} className="flex flex-col gap-4" aria-label="Nouvelle analyse de sol" noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={ETIQUETTE}>
          Parcelle <span className="text-xs font-normal text-muted">site {site.nom} · nom libre, facultatif</span>
          <input className={CHAMP} value={parcelle} maxLength={80} onChange={(e) => setParcelle(e.target.value)} placeholder="ex. Champ du bas" />
        </label>
        <label className={ETIQUETTE}>
          Type et texture du sol
          <select className={CHAMP} value={typeSol} onChange={(e) => setTypeSol(e.target.value as TypeSol | '')}>
            <option value="">Non précisé</option>
            {TYPES_SOL.map((t) => (
              <option key={t.valeur} value={t.valeur}>{t.libelle}</option>
            ))}
          </select>
        </label>
        <label className={ETIQUETTE}>
          Date de l&apos;analyse
          <input type="date" required className={CHAMP} value={date} max={aujourdhui()} min="1990-01-01" onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className={ETIQUETTE}>
          Méthode
          <select className={CHAMP} value={methode} onChange={(e) => setMethode(e.target.value as MethodeAnalyse)}>
            {METHODES.map((m) => (
              <option key={m.valeur} value={m.valeur}>{m.libelle}</option>
            ))}
          </select>
        </label>
        {methode === 'laboratoire' && (
          <label className={`${ETIQUETTE} sm:col-span-2`}>
            Laboratoire <span className="text-xs font-normal text-muted">facultatif</span>
            <input className={CHAMP} value={laboratoire} maxLength={100} onChange={(e) => setLaboratoire(e.target.value)} />
          </label>
        )}
      </div>

      <fieldset className="m-0 flex flex-col gap-2.5 rounded-[14px] border border-line-soft p-3.5">
        <legend className="px-1 text-sm font-semibold">Résultats mesurés</legend>
        <p className="m-0 text-xs text-muted">Laissez vide ce qui n&apos;a pas été mesuré : rien ne sera estimé à la place.</p>
        {PROPRIETES.map((p) => (
          <div key={p.valeur} className="grid grid-cols-[1fr_7rem_6.5rem] items-center gap-2">
            <label htmlFor={`mesure-${p.valeur}`} className="text-sm">{p.libelle}</label>
            <input
              id={`mesure-${p.valeur}`}
              inputMode="decimal"
              className={`${CHAMP} font-mono`}
              value={saisie[p.valeur].valeur}
              onChange={(e) => changer(p.valeur, 'valeur', e.target.value)}
              placeholder="—"
            />
            {p.unites.length > 1 ? (
              <select
                aria-label={`Unité : ${p.libelle}`}
                className={CHAMP}
                value={saisie[p.valeur].unite}
                onChange={(e) => changer(p.valeur, 'unite', e.target.value)}
              >
                {p.unites.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            ) : (
              <span className="px-3 text-sm text-muted">sans unité</span>
            )}
          </div>
        ))}
      </fieldset>

      <label className={ETIQUETTE}>
        Document du laboratoire <span className="text-xs font-normal text-muted">PDF, JPEG ou PNG, 10 Mo au maximum, facultatif</span>
        <input
          ref={champDocument}
          type="file"
          accept={TYPES_DOC.join(',')}
          onChange={(e) => choisirDocument(e.target.files?.[0])}
          className="text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-xl file:border-0 file:bg-accent-soft file:px-4 file:font-sans file:font-semibold file:text-accent"
        />
      </label>

      {erreur && <p role="alert" className="m-0 rounded-xl bg-risk-bg px-3 py-2 text-sm text-risk">{erreur}</p>}
      {succes && <p role="status" className="m-0 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">Analyse enregistrée.</p>}

      <button
        type="submit"
        disabled={envoi}
        className="min-h-12 cursor-pointer rounded-xl border-none bg-accent px-5 font-sans text-[15px] font-semibold text-white hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60 sm:self-start"
      >
        {envoi ? 'Enregistrement…' : 'Enregistrer l’analyse'}
      </button>
    </form>
  )
}
