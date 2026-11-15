// Mise en page des pages Connexion et Inscription (sur le modèle de CNX LINK) :
// panneau vert à gauche (titre, texte et atouts illustrés par des icônes SVG), formulaire sur fond blanc à droite.
import Link from 'next/link'
import type { ReactNode } from 'react'
import { NOM_AGENT } from '../agent/questions'
import { IcoBulle, IcoCarte, IcoCible, IcoFlecheGauche, IcoSatellite } from '../landing/icones'
import Logo from '../navigation/Logo'

const ATOUTS = [
  { icone: <IcoCible taille={22} />, titre: 'Le verdict de semis de votre site', texte: 'Favorable, risqué ou défavorable, avec la raison en une phrase.' },
  { icone: <IcoSatellite taille={22} />, titre: 'Les mesures des satellites de la NASA', texte: 'Pluie, chaleur et humidité du sol, mises à jour chaque jour.' },
  { icone: <IcoCarte taille={22} />, titre: 'Tous les sites suivis sur une carte', texte: 'Les sites suivis au Gabon et leur verdict, d’un coup d’œil.' },
  { icone: <IcoBulle taille={22} />, titre: `${NOM_AGENT}, votre guide`, texte: 'Il vous oriente et transmet vos questions à l’agent, sur le web ou sur Telegram.' },
] as const

export default function CadreAuth({ titre, texte, children }: { titre: string; texte: string; children: ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 bg-white lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* Panneau de présentation (ordinateur seulement) */}
      <aside className="relative hidden flex-col justify-between gap-12 overflow-hidden bg-profond px-14 py-12 text-white lg:flex xl:px-20">
        <div aria-hidden="true" className="absolute -top-40 -right-40 size-[520px] rounded-full bg-vif/20 blur-3xl" />
        <Link href="/" aria-label="S'STACK, accueil" className="relative self-start no-underline">
          <Logo clair sousTitre="Conseils de semis" />
        </Link>

        <div className="relative flex flex-col gap-10">
          <div className="flex max-w-[34rem] flex-col gap-4">
            <h1 className="m-0 font-display text-[clamp(2rem,2.8vw,2.6rem)] leading-[1.08] font-bold tracking-[-0.03em]">{titre}</h1>
            <p className="m-0 text-lg leading-relaxed text-white/80">{texte}</p>
          </div>
          <ul className="m-0 grid max-w-[40rem] list-none grid-cols-1 gap-x-8 gap-y-7 p-0 xl:grid-cols-2">
            {ATOUTS.map((a) => (
              <li key={a.titre} className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-menthe">{a.icone}</span>
                <span className="flex flex-col gap-1">
                  <span className="text-base font-semibold">{a.titre}</span>
                  <span className="text-sm leading-relaxed text-white/70">{a.texte}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative m-0 text-sm text-white/60">© 2026 S&apos;STACK · NASA Space Apps · Field Shift</p>
      </aside>

      {/* Formulaire */}
      <main id="contenu" className="flex flex-col px-5 py-8 sm:px-10 lg:px-14">
        <Link href="/" className="flex min-h-11 items-center gap-2 self-start text-[15px] font-medium text-encre no-underline hover:text-cnx">
          <IcoFlecheGauche taille={18} /> Retour à l&apos;accueil
        </Link>
        <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center gap-8 py-10">
          <div className="flex justify-center">
            <Logo sousTitre="Conseils de semis" />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
