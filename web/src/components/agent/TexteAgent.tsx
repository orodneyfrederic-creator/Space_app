// Affiche une réponse de l'agent : paragraphes, listes « - », **gras** et [liens](/page).
// Construit des éléments React (jamais de HTML injecté). Les liens internes passent par next/link :
// la page change sans recharger, l'agent reste ouvert avec sa conversation.
import Link from 'next/link'
import type { ReactNode } from 'react'

const MOTIF = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g

function enLigne(texte: string, cle: string): ReactNode[] {
  const morceaux: ReactNode[] = []
  let dernier = 0
  let n = 0
  for (const m of texte.matchAll(MOTIF)) {
    const debut = m.index ?? 0
    if (debut > dernier) morceaux.push(texte.slice(dernier, debut))
    const id = `${cle}-${n++}`
    if (m[1] !== undefined) {
      morceaux.push(<strong key={id} className="font-semibold">{m[1]}</strong>)
    } else {
      const [libelle, adresse] = [m[2], m[3]]
      const classe = 'font-semibold text-cnx underline decoration-cnx/40 underline-offset-2 hover:decoration-cnx'
      morceaux.push(
        adresse.startsWith('/') ? (
          <Link key={id} href={adresse} className={classe}>{libelle}</Link>
        ) : adresse.startsWith('https://') ? (
          <a key={id} href={adresse} target="_blank" rel="noreferrer" className={classe}>{libelle}</a>
        ) : (
          libelle
        ),
      )
    }
    dernier = debut + m[0].length
  }
  if (dernier < texte.length) morceaux.push(texte.slice(dernier))
  return morceaux
}

const PUCE = /^\s*([-*•]|\d+[.)])\s+/

/** Regroupe les lignes consécutives : texte → paragraphe, puces → liste. */
function groupes(texte: string): { liste: boolean; lignes: string[] }[] {
  const resultat: { liste: boolean; lignes: string[] }[] = []
  for (const brute of texte.trim().split('\n')) {
    const ligne = brute.replace(/^#{1,6}\s+/, '')
    if (!ligne.trim()) {
      resultat.push({ liste: false, lignes: [] }) // ligne vide : nouveau paragraphe
      continue
    }
    const liste = PUCE.test(ligne)
    const courant = resultat.at(-1)
    if (courant && courant.liste === liste && (liste || courant.lignes.length > 0)) courant.lignes.push(ligne)
    else resultat.push({ liste, lignes: [ligne] })
  }
  return resultat.filter((g) => g.lignes.length > 0)
}

export default function TexteAgent({ texte }: { texte: string }) {
  return (
    <div className="flex flex-col gap-2.5">
      {groupes(texte).map((g, i) =>
        g.liste ? (
          <ul key={i} className="m-0 flex list-disc flex-col gap-1 pl-5">
            {g.lignes.map((l, j) => <li key={j}>{enLigne(l.replace(PUCE, ''), `${i}-${j}`)}</li>)}
          </ul>
        ) : (
          <p key={i} className="m-0">
            {g.lignes.map((l, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {enLigne(l, `${i}-${j}`)}
              </span>
            ))}
          </p>
        ),
      )}
    </div>
  )
}
