// Hero de la landing, fidèle à la maquette d'origine : photo bien visible, cartes vitrées transparentes,
// mais en pleine largeur (pas de cadre arrondi autour). L'en-tête fixe est à part (EnTeteLanding).
// Les cartes de droite et le nombre de sites viennent du serveur.
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { CULTURES } from '@/lib/cultures'
import BoutonAgent from '../agent/BoutonAgent'
import { NOM_AGENT } from '../agent/questions'
import { GOUTTIERE } from './constantes'
import { CarteConditions, NombreSites } from './DonneesDirect'
import {
  IcoBulle,
  IcoCalendrier,
  IcoCarte,
  IcoCible,
  IcoCoche,
  IcoFleche,
  IcoGoutte,
  IcoGraine,
  IcoLecture,
  IcoMicro,
  IcoPersonnes,
  IcoRepere,
  IcoSatellite,
} from './icones'
import { PHOTOS } from './photos'

const ATOUTS = [
  { icone: <IcoCible taille={18} />, titre: ['Verdict de semis', 'site par site'], texte: 'Favorable, risqué ou défavorable, selon la pluie et le sol.' },
  { icone: <IcoSatellite taille={18} />, titre: ['Sol et pluie', 'vus du satellite'], texte: 'NASA POWER et SoilGrids, sans capteur à installer.' },
  { icone: <IcoPersonnes taille={18} />, titre: [NOM_AGENT, 'votre guide'], texte: 'Il vous oriente et transmet vos questions à l’agent.' },
  { icone: <IcoCarte taille={18} />, titre: ['La carte', 'des sites suivis'], texte: 'Tous les sites du Gabon, d’un coup d’œil.' },
] as const

const ETAPES = [
  { icone: <IcoRepere taille={14} />, couleur: 'text-pousse', label: 'Choisir le site' },
  { icone: <IcoCible taille={14} />, couleur: 'text-[#7FB2F0]', label: 'Lire le verdict' },
  { icone: <IcoMicro taille={14} />, couleur: 'text-sun', label: 'Poser sa question' },
  { icone: <IcoGraine taille={14} />, couleur: 'text-pousse', label: 'Semer' },
] as const

function Chiffre({ icone, valeur, libelle }: { icone: ReactNode; valeur: ReactNode; libelle: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-feuille text-white">{icone}</span>
      <span className="flex flex-col">
        <span className="font-mono text-[22px] leading-tight text-white">{valeur}</span>
        <span className="text-xs text-white/75">{libelle}</span>
      </span>
    </div>
  )
}

export default function Hero() {
  return (
    <section id="accueil" aria-labelledby="titre-hero" className="relative isolate overflow-hidden bg-sous-bois pt-20 text-white">
      {/* Photo retournée pour que l'agriculteur soit à droite, comme sur la maquette */}
      <Image
        src={PHOTOS.hero}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="-z-20 -scale-x-100 object-cover object-[35%_center]"
      />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-sous-bois/90 via-sous-bois/50 to-sous-bois/10" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-sous-bois/90 via-transparent to-sous-bois/40" />

      <div className={`pt-12 pb-8 lg:pt-16 lg:pb-10 ${GOUTTIERE}`}>
        <div id="contenu" className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Colonne gauche : message + atouts */}
          <div className="flex min-w-0 flex-col">
            <p className="m-0 inline-flex min-h-8 items-center gap-2 self-start rounded-full border border-white/35 bg-white/10 px-4 py-1.5 text-xs text-white backdrop-blur-md">
              <span className="text-pousse"><IcoCoche /></span>
              Les données de la NASA au service des champs gabonais
            </p>
            <h1 id="titre-hero" className="m-0 mt-6 font-display text-[clamp(2.3rem,5vw,4.3rem)] leading-[1.05] font-normal tracking-[-0.02em]">
              Aider les producteurs
              <br />
              à semer au <span className="text-pousse">bon moment</span>
              <br />
              <span className="text-pousse">grâce aux données NASA</span>
            </h1>
            <p className="m-0 mt-5 text-lg text-white/90">Le savoir de nos terroirs. Les mesures des satellites.</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <BoutonAgent className="flex h-[54px] items-center gap-4 rounded-full border-0 bg-feuille pr-2.5 pl-7 font-sans text-base text-white shadow-lg transition-colors hover:bg-feuille-hover">
                Parler à {NOM_AGENT}
                <span className="flex size-[34px] items-center justify-center rounded-full border-2 border-white">
                  <IcoFleche />
                </span>
              </BoutonAgent>
              <Link
                href="/tableau-de-bord"
                className="flex h-[54px] items-center gap-4 rounded-full border border-white/50 bg-black/10 pr-2.5 pl-7 text-base text-white no-underline backdrop-blur-md transition-colors hover:bg-white/10"
              >
                Voir le tableau de bord
                <span className="flex size-[34px] items-center justify-center rounded-full border-2 border-white">
                  <IcoLecture taille={14} />
                </span>
              </Link>
            </div>

            <ul className="m-0 mt-12 grid list-none grid-cols-1 gap-3.5 p-0 sm:grid-cols-2 lg:mt-16 xl:grid-cols-4">
              {ATOUTS.map((a) => (
                <li
                  key={a.titre[0]}
                  className="flex flex-col rounded-[20px] border border-white/15 bg-sous-bois/35 p-5 backdrop-blur-md sm:min-h-[186px]"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-menthe-pale text-[#1F5A2C]">{a.icone}</span>
                  <h2 className="m-0 mt-auto pt-5 font-display text-[17px] leading-snug font-normal text-white sm:pt-8">
                    {a.titre[0]}
                    <br />
                    {a.titre[1]}
                  </h2>
                  <p className="m-0 mt-3 text-xs leading-relaxed text-white/70">{a.texte}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne droite : données en direct */}
          <div className="flex min-w-0 flex-col gap-3">
            <CarteConditions />
            <div className="rounded-[22px] border border-white/20 bg-white/[0.06] p-4 backdrop-blur-md lg:mx-5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-feuille text-white"><IcoCalendrier taille={16} /></span>
                <span className="text-[11px] font-medium tracking-[0.1em] text-white/85 uppercase">En 4 étapes</span>
              </div>
              <ol className="m-0 mt-4 grid list-none grid-cols-4 gap-1.5 p-0">
                {ETAPES.map((e, i) => (
                  <li key={e.label} className="flex flex-col items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-1 py-2 text-center">
                    <span className="font-mono text-[9px] text-white/60">0{i + 1}</span>
                    <span className={e.couleur}>{e.icone}</span>
                    <span className="text-[9.5px] leading-tight text-white">{e.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Barre des chiffres */}
        <div className="mx-auto mt-10 grid max-w-[1160px] grid-cols-1 gap-6 rounded-[26px] border border-white/10 bg-sous-bois/60 px-6 py-6 backdrop-blur-md sm:grid-cols-2 lg:mt-14 lg:flex lg:justify-between lg:px-12">
          <Chiffre icone={<IcoRepere />} valeur={<NombreSites />} libelle="Sites suivis au Gabon" />
          <Chiffre icone={<IcoGoutte />} valeur="30 j" libelle="De pluie analysés par site" />
          <Chiffre icone={<IcoGraine />} valeur={CULTURES.length} libelle="Cultures repères" />
          <Chiffre icone={<IcoBulle />} valeur="2" libelle="Canaux : web et Telegram" />
        </div>
      </div>
    </section>
  )
}
