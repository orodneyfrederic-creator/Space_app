// Logo officiel S'STACK (fichiers de public/brand/, voir lib/marque.ts).
// Symbole : une feuille aux couleurs du drapeau gabonais (vert, jaune, bleu), la même sur toutes les versions.
// - fond clair  → logo « principal » (feuille + STACK Noir Ébène)
// - fond sombre → logo « négatif » (feuille + STACK blanc) : prop `clair`
// - `variante` permet de forcer une version (tricolore, icône seule…).
// Texte alternatif : « S'STACK », le nom du projet.
import Image from 'next/image'
import { LOGOS, MARQUE, type VarianteLogo } from '@/lib/marque'

type Props = {
  /** true sur fond sombre (Vert Forêt, Noir Ébène, photo) : version négative */
  clair?: boolean
  /** petite ligne sous le logo (ex. « Farm Intelligence ») */
  sousTitre?: string
  /** pour forcer une version précise du logo */
  variante?: VarianteLogo
  /** hauteur affichée du logo en pixels (30 par défaut) */
  hauteur?: number
  /** à mettre sur le logo visible dès l'arrivée sur la page (en-tête) */
  prioritaire?: boolean
}

export default function Logo({ clair = false, sousTitre, variante, hauteur = 30, prioritaire = false }: Props) {
  const choix: VarianteLogo = variante ?? (clair ? 'negatif' : 'principal')
  const logo = LOGOS[choix]
  const largeur = Math.round((hauteur * logo.largeur) / logo.hauteur)
  const surFondSombre = clair || choix === 'negatif'

  return (
    <span className="flex flex-col gap-1">
      <Image
        src={logo.src}
        alt={MARQUE.nom}
        width={largeur}
        height={hauteur}
        priority={prioritaire}
        className="block h-auto max-w-none select-none"
        style={{ width: largeur, height: hauteur }}
        draggable={false}
      />
      {sousTitre && (
        <span
          className={`pl-0.5 text-[9px] leading-none font-medium tracking-[0.12em] uppercase ${surFondSombre ? 'text-white/75' : 'text-muted'}`}
        >
          {sousTitre}
        </span>
      )}
    </span>
  )
}
