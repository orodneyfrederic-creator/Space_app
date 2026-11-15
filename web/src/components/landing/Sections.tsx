// Sections de la landing, sous le hero. Pleine largeur, angles droits, aplats verts
// (design system CNX 4.0). Aucune donnée inventée : pas de faux témoignages ni de faux
// chiffres d'impact, seulement ce que l'application fait et des questions à poser à l'agent.
import Image, { type StaticImageData } from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { CULTURES, type Culture } from '@/lib/cultures'
import BoutonAgent from '../agent/BoutonAgent'
import { NOM_AGENT } from '../agent/questions'
import Logo from '../navigation/Logo'
import Carrousel from './Carrousel'
import { ANCRES, GOUTTIERE } from './constantes'
import { IcoBulle, IcoCarte, IcoFleche, IcoGraphique, IcoGuillemets, IcoHorloge, IcoTableau } from './icones'
import { CREDITS, PHOTOS } from './photos'
import Solutions from './Solutions'

const TITRE_H2 = 'm-0 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.05] font-bold tracking-[-0.04em] text-encre'

/** Petit sur-titre : trait vert + libellé en capitales. */
function SurTitre({ children, clair = false }: { children: ReactNode; clair?: boolean }) {
  return (
    <p className={`m-0 flex items-center gap-3 text-xs font-semibold tracking-[0.16em] uppercase ${clair ? 'text-menthe' : 'text-cnx'}`}>
      <span aria-hidden="true" className="h-px w-10 bg-vif" />
      {children}
    </p>
  )
}

function PhotoEnLigne({ photo, alt }: { photo: StaticImageData; alt: string }) {
  return (
    <span className="relative mx-2 inline-block h-[0.95em] w-[2.2em] -translate-y-[0.04em] overflow-hidden rounded-full align-middle">
      <Image src={photo} alt={alt} fill sizes="120px" className="object-cover" />
    </span>
  )
}

/* ─────────────── À propos ─────────────── */
function APropos() {
  return (
    <section id="a-propos" aria-label="À propos" className={`grid grid-cols-1 gap-8 bg-white py-24 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 lg:py-32 ${GOUTTIERE}`}>
      <SurTitre>À propos</SurTitre>
      <p className="m-0 font-display text-[clamp(1.7rem,3.6vw,3.3rem)] leading-[1.25] font-semibold tracking-[-0.03em] text-encre">
        Nous aidons les producteurs
        <PhotoEnLigne photo={PHOTOS.pastille1} alt="Une agricultrice tient une poignée d’herbe." />
        à semer au <span className="text-success">bon moment</span>, grâce aux mesures des satellites
        <PhotoEnLigne photo={PHOTOS.pastille3} alt="Vue aérienne de champs verts." />
        de la NASA et à un agent
        <PhotoEnLigne photo={PHOTOS.pastille2} alt="Des mains tiennent des grains récoltés." />
        qui répond à leurs questions.
      </p>
    </section>
  )
}

/* ─────────────── Solutions ─────────────── */
function SectionSolutions() {
  return (
    <section id="solutions" aria-labelledby="titre-solutions" className="bg-pale py-24 lg:py-32">
      <div className={`flex flex-wrap items-end justify-between gap-6 pb-12 ${GOUTTIERE}`}>
        <div className="flex flex-col gap-5">
          <SurTitre>Solutions</SurTitre>
          <h2 id="titre-solutions" className={TITRE_H2}>
            Des solutions pour vos champs
          </h2>
        </div>
        <Link
          href="/tableau-de-bord"
          className="flex h-12 items-center gap-2 rounded-[10px] border border-cnx px-6 text-sm font-semibold text-cnx no-underline transition-colors hover:bg-cnx hover:text-white"
        >
          Tout voir <IcoFleche taille={14} />
        </Link>
      </div>
      <Solutions />
    </section>
  )
}

/* ─────────────── Outils ─────────────── */
const OUTILS = [
  { icone: <IcoTableau taille={28} />, titre: 'Tableau de bord', texte: 'Le verdict et les conditions du site choisi.', href: '/tableau-de-bord' },
  { icone: <IcoCarte taille={28} />, titre: 'Carte des sites', texte: 'Tous les sites suivis et leur verdict.', href: '/carte' },
  { icone: <IcoGraphique taille={28} />, titre: 'Données NASA', texte: 'Pluie, chaleur et sol, en détail.', href: '/donnees' },
  { icone: <IcoHorloge taille={28} />, titre: 'Historique', texte: 'Les conseils déjà donnés, sur le web et Telegram.', href: '/historique' },
] as const

function Outils() {
  return (
    <section id="outils" aria-labelledby="titre-outils" className="bg-white py-24 lg:py-32">
      <div className={`flex flex-col gap-5 pb-12 ${GOUTTIERE}`}>
        <SurTitre>Outils</SurTitre>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="titre-outils" className={TITRE_H2}>Nos outils</h2>
          <p className="m-0 max-w-[46ch] text-base leading-relaxed text-ardoise">
            Tout ce qu&apos;il faut pour décider quand et quoi semer, à partir de données ouvertes.
          </p>
        </div>
      </div>
      <ul className={`m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4 ${GOUTTIERE}`}>
        {OUTILS.map((o, i) => (
          <li key={o.href} className="flex">
            <Link
              href={o.href}
              className="group flex min-h-[280px] w-full flex-col justify-between gap-10 rounded-2xl border border-[#D9E3DD] bg-white p-8 no-underline transition-colors hover:border-profond hover:bg-profond lg:p-9"
            >
              <span className="flex items-start justify-between">
                <span className="text-cnx transition-colors group-hover:text-menthe">{o.icone}</span>
                <span className="font-mono text-sm text-ardoise transition-colors group-hover:text-white/60">0{i + 1}</span>
              </span>
              <span className="flex flex-col gap-3">
                <span className="font-display text-2xl font-bold tracking-[-0.02em] text-encre transition-colors group-hover:text-white">{o.titre}</span>
                <span className="text-sm leading-relaxed text-ardoise transition-colors group-hover:text-white/75">{o.texte}</span>
                <span className="mt-2 flex items-center gap-2 text-sm font-semibold text-cnx transition-colors group-hover:text-menthe">
                  Ouvrir <IcoFleche taille={14} />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/* ─────────────── Méthode (photo pleine largeur + bandeau vert) ─────────────── */
const ETAPES_METHODE = [
  { n: '01', titre: 'Mesurer', texte: 'NASA POWER relève pluie, chaleur et humidité du sol, chaque jour.' },
  { n: '02', titre: 'Comparer', texte: 'S’STACK compare la saison à la normale et repère le début des pluies.' },
  { n: '03', titre: 'Conseiller', texte: 'Vous recevez un verdict clair et des réponses à vos questions.' },
] as const

function Methode() {
  return (
    <section id="methode" aria-labelledby="titre-methode" className="grid grid-cols-1 bg-profond text-white lg:grid-cols-2">
      <div className="relative m-4 min-h-[360px] overflow-hidden rounded-2xl lg:m-6 lg:min-h-[600px]">
        <Image src={PHOTOS.impact} alt="Une agricultrice plante du manioc sur une colline, d’autres travaillent derrière elle." fill sizes="(min-width: 1024px) 50vw, 100vw" placeholder="blur" className="object-cover" />
      </div>
      <div className={`flex flex-col justify-center gap-8 py-20 lg:py-24 ${GOUTTIERE}`}>
        <SurTitre clair>Méthode</SurTitre>
        <h2 id="titre-methode" className="m-0 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.05] font-bold tracking-[-0.04em]">
          Des satellites jusqu&apos;à <span className="text-pousse">votre champ</span>.
        </h2>
        <p className="m-0 max-w-[56ch] text-base leading-relaxed text-white/75">
          Pas de capteur à acheter ni de matériel à installer : les données viennent des satellites et des modèles de la NASA, et de la base
          de sols SoilGrids.
        </p>
        <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3">
          {ETAPES_METHODE.map((e) => (
            <li key={e.n} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
              <span className="font-mono text-3xl font-bold text-pousse">{e.n}</span>
              <span className="text-lg font-semibold">{e.titre}</span>
              <span className="text-sm leading-relaxed text-white/70">{e.texte}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ─────────────── Questions (format « témoignages », sans faux témoins) ─────────────── */
const PHOTO_QUESTION: Record<Culture['id'], { photo: StaticImageData; alt: string }> = {
  manioc: { photo: PHOTOS.impact, alt: 'Une agricultrice plante du manioc.' },
  plantain: { photo: PHOTOS.telegram, alt: 'Un agriculteur porte une brassée d’herbe devant des bananiers.' },
  arachide: { photo: PHOTOS.hero, alt: 'Un agriculteur inspecte ses plants de légumineuses.' },
  mais: { photo: PHOTOS.mais, alt: 'Une jeune femme dans un champ de maïs en fleurs.' },
}

function Questions() {
  return (
    <section aria-labelledby="titre-questions" className="bg-pale py-24 lg:py-32">
      <div className={GOUTTIERE}>
        <Carrousel
          etiquette="Questions à poser à l'agent"
          entete={
            <div className="flex flex-col gap-5">
              <SurTitre>Questions</SurTitre>
              <h2 id="titre-questions" className={TITRE_H2}>
                Ce que les producteurs demandent
              </h2>
              <p className="m-0 text-base text-ardoise">Des questions prêtes à envoyer à {NOM_AGENT}, en un clic.</p>
            </div>
          }
        >
          {CULTURES.map((c) => {
            const { photo, alt } = PHOTO_QUESTION[c.id]
            const question = c.questions[0]
            return (
              <li key={c.id} className="w-[min(640px,88vw)] shrink-0 snap-start">
                <article className="grid h-full grid-cols-1 gap-2 rounded-2xl border border-[#D9E3DD] bg-white p-2 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
                  <div className="relative h-56 overflow-hidden rounded-xl sm:h-full sm:min-h-[300px]">
                    <Image src={photo} alt={alt} fill sizes="(min-width: 640px) 300px, 88vw" placeholder="blur" className="object-cover" />
                  </div>
                  <div className="flex flex-col gap-4 p-5 sm:p-6">
                    <span className="text-vif"><IcoGuillemets taille={30} /></span>
                    <span className="text-xs font-semibold tracking-[0.12em] text-cnx uppercase">{c.nom}</span>
                    <p className="m-0 font-display text-xl leading-snug font-semibold tracking-[-0.01em] text-encre">{question}</p>
                    <BoutonAgent
                      question={question}
                      className="mt-auto flex h-12 w-full items-center justify-between gap-3 rounded-[10px] border-0 bg-pale px-4 font-sans text-sm font-semibold text-cnx transition-colors hover:bg-[#E3EEE8]"
                    >
                      Demander à {NOM_AGENT} <IcoFleche taille={16} />
                    </BoutonAgent>
                  </div>
                </article>
              </li>
            )
          })}
        </Carrousel>
      </div>
    </section>
  )
}

/* ─────────────── Repères par culture (format « articles ») ─────────────── */
const PHOTO_CULTURE: Record<Culture['id'], { photo: StaticImageData; alt: string }> = {
  manioc: { photo: PHOTOS.manioc, alt: 'Des racines de manioc fraîchement récoltées.' },
  plantain: { photo: PHOTOS.plantain, alt: 'Un régime de bananes plantain sur le bananier.' },
  arachide: { photo: PHOTOS.arachide, alt: 'Un tas d’arachides en coque.' },
  mais: { photo: PHOTOS.mais, alt: 'Un champ de maïs en fleurs.' },
}

function Reperes() {
  return (
    <section id="cultures" aria-labelledby="titre-cultures" className="bg-white py-24 lg:py-32">
      <div className={`flex flex-col gap-5 pb-12 ${GOUTTIERE}`}>
        <SurTitre>Cultures</SurTitre>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="titre-cultures" className={TITRE_H2}>Repères par culture</h2>
          <p className="m-0 max-w-[52ch] text-base leading-relaxed text-ardoise">
            Quand planter le manioc, le plantain, l&apos;arachide ou le maïs : les repères de l&apos;équipe, à faire valider par un agronome.
          </p>
        </div>
      </div>
      <ul className={`m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4 ${GOUTTIERE}`}>
        {CULTURES.map((c) => {
          const { photo, alt } = PHOTO_CULTURE[c.id]
          return (
            <li key={c.id} className="flex">
              <Link href="/cultures" className="group flex w-full flex-col overflow-hidden rounded-2xl border border-[#D9E3DD] bg-white no-underline transition-shadow hover:shadow-[0_20px_40px_-24px_rgba(2,69,52,0.45)]">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={photo}
                    alt={alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    placeholder="blur"
                    className={`object-cover transition-transform duration-500 group-hover:scale-105 ${c.id === 'mais' ? 'object-top' : ''}`}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-7">
                  <span className="text-[11px] font-semibold tracking-[0.12em] text-ardoise uppercase">Repère à valider</span>
                  <h3 className="m-0 font-display text-2xl font-bold tracking-[-0.02em] text-encre">{c.nom}</h3>
                  <p className="m-0 text-sm leading-relaxed text-ardoise">{c.repere}</p>
                  <span className="mt-auto flex items-center gap-2 pt-3 text-sm font-semibold text-cnx group-hover:text-vif-hover">
                    Voir les questions <IcoFleche taille={14} />
                  </span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/* ─────────────── Appel à l'action ─────────────── */
function Appel() {
  return (
    <section aria-labelledby="titre-appel" className={`flex flex-col items-start justify-between gap-10 bg-cnx py-20 text-white lg:flex-row lg:items-end lg:py-24 ${GOUTTIERE}`}>
      <div className="flex flex-col gap-5">
        <h2 id="titre-appel" className="m-0 font-display text-[clamp(2.2rem,4.6vw,4rem)] leading-[1.02] font-bold tracking-[-0.04em]">
          Prêt à semer au bon moment&nbsp;?
        </h2>
        <p className="m-0 max-w-[56ch] text-lg text-white/90">
          Créez votre compte, choisissez votre site et laissez {NOM_AGENT} vous guider, sur le web ou sur Telegram.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/inscription" className="flex h-14 items-center gap-3 rounded-[10px] bg-white px-7 text-base font-semibold text-profond no-underline hover:bg-pale">
          Créer un compte <IcoFleche />
        </Link>
        <BoutonAgent className="flex h-14 items-center gap-3 rounded-[10px] border border-white bg-transparent px-7 font-sans text-base font-semibold text-white hover:bg-white/10">
          Parler à {NOM_AGENT} <IcoBulle />
        </BoutonAgent>
      </div>
    </section>
  )
}

/* ─────────────── Pied de page ─────────────── */
const LIENS_APP = [
  { href: '/connexion', label: 'Se connecter' },
  { href: '/inscription', label: 'Créer un compte' },
  { href: '/tableau-de-bord', label: 'Tableau de bord' },
  { href: '/carte', label: 'Carte' },
  { href: '/donnees', label: 'Données' },
  { href: '/cultures', label: 'Cultures' },
  { href: '/discuter', label: 'Agent' },
] as const

const SOURCES = [
  { href: 'https://power.larc.nasa.gov/', label: 'NASA POWER' },
  { href: 'https://soilgrids.org/', label: 'SoilGrids (ISRIC)' },
  { href: 'https://unsplash.com/license', label: 'Photos Unsplash' },
] as const

function PiedDePage() {
  const titreCol = 'm-0 mb-5 text-xs font-semibold tracking-[0.16em] text-menthe uppercase'
  const lien = 'text-sm text-white/80 no-underline hover:text-white'
  return (
    <footer className="bg-nuit text-white">
      <div aria-hidden="true" className="bande-tricolore" />
      <div className={`grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] ${GOUTTIERE}`}>
        <div className="flex flex-col gap-5">
          <Logo clair sousTitre="Conseils de semis" />
          <p className="m-0 max-w-[40ch] text-sm leading-relaxed text-white/65">
            Des conseils agricoles pour les producteurs gabonais, à partir des données ouvertes de la NASA.
          </p>
        </div>
        <nav aria-label="Application">
          <p className={titreCol}>Application</p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {LIENS_APP.map((l) => <li key={l.href}><Link href={l.href} className={lien}>{l.label}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Sur cette page">
          <p className={titreCol}>Sur cette page</p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {ANCRES.map((a) => <li key={a.href}><a href={a.href} className={lien}>{a.label}</a></li>)}
          </ul>
        </nav>
        <nav aria-label="Sources">
          <p className={titreCol}>Sources</p>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {SOURCES.map((s) => <li key={s.href}><a href={s.href} target="_blank" rel="noreferrer" className={lien}>{s.label}</a></li>)}
          </ul>
        </nav>
      </div>
      <div className={`flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/50 ${GOUTTIERE}`}>
        <p className="m-0">NASA Space Apps 2026 · Field Shift · Équipe S&apos;STACK</p>
        <p className="m-0 leading-relaxed">
          Photos :{' '}
          {CREDITS.map((c, i) => (
            <span key={c.lien}>
              <a href={c.lien} target="_blank" rel="noreferrer" className="text-white/65 underline-offset-2 hover:text-white">{c.auteur}</a>
              {i < CREDITS.length - 1 ? ', ' : ''}
            </span>
          ))}{' '}
          sur Unsplash.
        </p>
      </div>
    </footer>
  )
}

export default function Sections() {
  return (
    <>
      <main>
        <APropos />
        <SectionSolutions />
        <Outils />
        <Methode />
        <Questions />
        <Reperes />
        <Appel />
      </main>
      <PiedDePage />
    </>
  )
}
