'use client'
// Liste des solutions en accordéon : une seule ouverte à la fois, avec photo et texte détaillé.
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import { useId, useState, type ReactNode } from 'react'
import BoutonAgent from '../agent/BoutonAgent'
import { NOM_AGENT } from '../agent/questions'
import { IcoBulle, IcoCible, IcoCouches, IcoDiagonale, IcoDiagonaleBas, IcoGoutte } from './icones'
import { GOUTTIERE } from './constantes'
import { PHOTOS } from './photos'

type Solution = {
  icone: ReactNode
  titre: string
  resume: string
  detail: string
  /** Lien vers une page, ou « agent » : le bouton ouvre l'agent flottant. */
  lien: { href: string; label: string } | { agent: true; label: string }
  photo: StaticImageData
  alt: string
}

const SOLUTIONS: readonly Solution[] = [
  {
    icone: <IcoBulle taille={22} />,
    titre: `${NOM_AGENT}, l’agent conseiller`,
    resume: 'Il vous guide dans l’application et répond à vos questions.',
    detail: `${NOM_AGENT} vous oriente vers la bonne page et répond aux questions rapides. Pour une question agricole, il passe la main à l’agent S’STACK, qui lit la fiche de votre site — pluie des 7 et 30 derniers jours, écart à la normale, humidité du sol, démarrage de la saison — et vous répond en français simple, ici ou sur Telegram (bot @sstack_agri_bot).`,
    lien: { agent: true, label: `Parler à ${NOM_AGENT}` },
    photo: PHOTOS.numerique,
    alt: 'Une agricultrice consulte un ordinateur portable au milieu de son champ.',
  },
  {
    icone: <IcoCible taille={22} />,
    titre: 'Le verdict de semis',
    resume: 'Favorable, risqué ou défavorable : le bon moment pour semer, site par site.',
    detail:
      'Le verdict combine la pluie récente, son écart à la normale du mois et l’humidité du sol mesurées par la NASA. Il dit s’il vaut mieux semer maintenant ou attendre, et pourquoi, en une phrase.',
    lien: { href: '/tableau-de-bord', label: 'Voir le verdict' },
    photo: PHOTOS.impact,
    alt: 'Une agricultrice plante des boutures de manioc dans un champ vallonné.',
  },
  {
    icone: <IcoGoutte taille={22} />,
    titre: 'Le suivi de la pluie',
    resume: 'Les 30 derniers jours de pluie comparés à la normale de saison.',
    detail:
      'Chaque jour, S’STACK récupère la pluie mesurée par NASA POWER pour chaque site et la compare à la moyenne du mois. Un graphique montre d’un coup d’œil si la saison est en avance, normale ou en retard.',
    lien: { href: '/donnees', label: 'Voir les données' },
    photo: PHOTOS.pastille3,
    alt: 'Vue aérienne de champs verts.',
  },
  {
    icone: <IcoCouches taille={22} />,
    titre: 'L’analyse du sol',
    resume: 'Texture, acidité et matière organique de votre terre, grâce à SoilGrids.',
    detail:
      'La part d’argile et de sable, le pH et le carbone du sol viennent de la base mondiale SoilGrids. L’agent s’en sert pour dire quelles cultures conviennent à votre terre et comment la faire reposer.',
    lien: { href: '/donnees', label: 'Voir le sol' },
    photo: PHOTOS.pastille1,
    alt: 'Une agricultrice tient une poignée d’herbe fraîche.',
  },
]

/** Bouton d'action d'une solution : lien vers une page, ou ouverture de l'agent flottant. */
function Action({ lien, className }: { lien: Solution['lien']; className: string }) {
  const style = `h-12 items-center rounded-[10px] bg-vif px-6 text-sm font-semibold text-white no-underline hover:bg-vif-hover ${className}`
  return 'agent' in lien ? (
    <BoutonAgent className={`border-0 font-sans ${style}`}>{lien.label}</BoutonAgent>
  ) : (
    <Link href={lien.href} className={style}>{lien.label}</Link>
  )
}

export default function Solutions() {
  const [ouverte, setOuverte] = useState(0)
  const base = useId()

  return (
    <ul className="m-0 flex list-none flex-col border-t border-[#D9E3DD] p-0">
      {SOLUTIONS.map((s, i) => {
        const estOuverte = i === ouverte
        const idPanneau = `${base}-panneau-${i}`
        return (
          <li key={s.titre} className={`border-b border-[#D9E3DD] py-6 transition-colors sm:py-7 ${estOuverte ? 'bg-white' : 'bg-transparent'} ${GOUTTIERE}`}>
            <div className="flex items-center gap-4 sm:gap-6">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[#D9E3DD] bg-white text-cnx">{s.icone}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:pl-6 lg:pl-16">
                <h3 className={`m-0 font-display text-xl font-bold tracking-[-0.02em] sm:text-2xl ${estOuverte ? 'text-cnx' : 'text-encre'}`}>{s.titre}</h3>
                <p className="m-0 text-sm text-ardoise">{s.resume}</p>
              </div>
              {estOuverte && <Action lien={s.lien} className="hidden shrink-0 md:flex" />}
              <button
                type="button"
                onClick={() => setOuverte(estOuverte ? -1 : i)}
                aria-expanded={estOuverte}
                aria-controls={idPanneau}
                aria-label={`${estOuverte ? 'Replier' : 'Déplier'} : ${s.titre}`}
                className="flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#D9E3DD] bg-transparent text-encre hover:border-cnx hover:text-cnx"
              >
                {estOuverte ? <IcoDiagonaleBas /> : <IcoDiagonale />}
              </button>
            </div>
            <div id={idPanneau} hidden={!estOuverte} className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-[260px_minmax(0,1fr)] lg:pl-[84px] xl:grid-cols-[340px_minmax(0,1fr)]">
              <div className="relative h-52 overflow-hidden rounded-2xl sm:h-full sm:min-h-[200px]">
                <Image src={s.photo} alt={s.alt} fill sizes="(min-width: 1280px) 340px, (min-width: 640px) 260px, 100vw" className="object-cover" placeholder="blur" />
              </div>
              <div className="flex flex-col gap-4">
                <p className="m-0 max-w-[62ch] text-lg leading-relaxed text-ardoise sm:text-xl">{s.detail}</p>
                <Action lien={s.lien} className="flex self-start md:hidden" />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
