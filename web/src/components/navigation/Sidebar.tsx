'use client'
// Sidebar de l'espace agriculteur (« Farm Intelligence »), d'après le croquis de l'équipe.
// - Ordinateur (≥ 1024 px) : fixe à gauche, rubriques dépliables ; celle de la page en cours est ouverte.
// - Téléphone et tablette : le même contenu en tiroir, ouvert par l'onglet « Menu » (événement sstack:ouvrir-menu).
// Suspense : usePathname() n'est connu qu'au moment de la requête (Next.js 16) ; en attendant,
// la même sidebar s'affiche sans entrée active.
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState, type ReactNode } from 'react'
import BoutonVisite, { IcoVisite } from '../aide/BoutonVisite'
import { Survol } from '../aide/Infobulle'
import { deconnecter } from '@/lib/api'
import { useSession } from '@/lib/session'
import { IcoChevron, IcoFermer, IcoTableau } from '../landing/icones'
import Logo from './Logo'
import { CENTRE_AIDE, estPageActive, EVENEMENT_OUVRIR_MENU, PARAMETRES, RUBRIQUES, type PageMenu, type Rubrique, VUE_ENSEMBLE } from './menu'

function Entree({ page, chemin, icone }: { page: PageMenu; chemin: string | null; icone?: ReactNode }) {
  const actif = chemin !== null && estPageActive(chemin, page)
  // Au survol (souris) ou au clavier : ce que contient la page, en une phrase
  const description = page.aVenir ? `Bientôt : ${page.description}` : page.description
  return (
    <Survol texte={description}>
      {(idDescription) => (
    <Link
      href={page.href}
      aria-current={actif ? 'page' : undefined}
      aria-describedby={idDescription}
      className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-[14px] no-underline transition-colors ${
        actif ? 'bg-white/12 font-semibold text-white' : 'text-white/70 hover:bg-white/6 hover:text-white'
      }`}
    >
      {icone}
      <span className="min-w-0 flex-1 truncate">{page.titre}</span>
      {actif && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-pousse" />}
    </Link>
      )}
    </Survol>
  )
}

function GroupeRubrique({ rubrique, chemin, ouvert, surBascule }: { rubrique: Rubrique; chemin: string | null; ouvert: boolean; surBascule: () => void }) {
  const Icone = rubrique.icone
  const contientActive = chemin !== null && rubrique.pages.some((p) => estPageActive(chemin, p))
  const idListe = `menu-${rubrique.id}`
  return (
    <li>
      <button
        type="button"
        onClick={surBascule}
        aria-expanded={ouvert}
        aria-controls={idListe}
        className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-left font-sans text-[11.5px] font-semibold tracking-[0.1em] uppercase transition-colors hover:bg-white/6 ${
          contientActive ? 'text-pousse' : 'text-white/85'
        }`}
      >
        <span className={contientActive ? 'text-pousse' : 'text-menthe-pale/80'}><Icone taille={18} /></span>
        <span className="min-w-0 flex-1">{rubrique.titre}</span>
        <span className={`text-white/50 transition-transform duration-200 ${ouvert ? 'rotate-180' : ''}`}><IcoChevron /></span>
      </button>
      <ul id={idListe} hidden={!ouvert} className="m-0 mt-0.5 mb-2 ml-[22px] flex list-none flex-col gap-0.5 border-l border-white/12 p-0 pl-3">
        {rubrique.pages.map((p) => (
          <li key={p.href}>
            <Entree page={p} chemin={chemin} />
          </li>
        ))}
      </ul>
    </li>
  )
}

function Contenu({ chemin, surFermeture }: { chemin: string | null; surFermeture?: () => void }) {
  // Rubrique dépliée par la personne ; sinon, celle qui contient la page en cours.
  const [bascules, setBascules] = useState<Record<string, boolean>>({})
  const estOuverte = (r: Rubrique) => bascules[r.id] ?? (chemin !== null && r.pages.some((p) => estPageActive(chemin, p)))
  const basculer = (r: Rubrique) => setBascules((b) => ({ ...b, [r.id]: !estOuverte(r) }))

  return (
    <div className="flex h-full flex-col bg-profond text-white">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 pt-5 pb-4">
        <div className="flex flex-col gap-2">
          <Link href="/" aria-label="S'STACK, page d'accueil" className="no-underline">
            <Logo clair sousTitre="Farm Intelligence" />
          </Link>
          <p className="m-0 text-xs leading-snug text-white/60">Votre agriculture, pilotée par la donnée.</p>
        </div>
        {surFermeture && (
          <button
            type="button"
            onClick={surFermeture}
            aria-label="Fermer le menu"
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-white/10 text-white hover:bg-white/15"
          >
            <IcoFermer />
          </button>
        )}
      </div>

      <nav aria-label="Navigation principale" className="sidebar-defilement flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <p className="m-0 px-3 pb-1 text-[10.5px] font-semibold tracking-[0.14em] text-white/45 uppercase">Vue d&apos;ensemble</p>
        <Entree page={VUE_ENSEMBLE} chemin={chemin} icone={<IcoTableau taille={18} />} />

        <ul className="m-0 mt-3 flex list-none flex-col gap-0.5 p-0">
          {RUBRIQUES.map((r) => (
            <GroupeRubrique key={r.id} rubrique={r} chemin={chemin} ouvert={estOuverte(r)} surBascule={() => basculer(r)} />
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-white/10 px-3 py-3">
        <ul className="m-0 list-none p-0">
          <GroupeRubrique rubrique={PARAMETRES} chemin={chemin} ouvert={estOuverte(PARAMETRES)} surBascule={() => basculer(PARAMETRES)} />
        </ul>
        <Entree page={CENTRE_AIDE} chemin={chemin} icone={<CENTRE_AIDE.icone taille={18} />} />
        <BoutonVisite className="flex min-h-10 w-full items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-left font-sans text-[14px] text-white/70 transition-colors hover:bg-white/6 hover:text-white">
          <IcoVisite />
          Visite guidée
        </BoutonVisite>
        <BlocCompte />
      </div>
    </div>
  )
}

/** Producteur connecté + déconnexion (la garde renvoie ensuite vers /connexion). */
function BlocCompte() {
  const session = useSession()
  const router = useRouter()
  if (!session) return null
  return (
    <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 px-3 pt-3">
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[14px] font-semibold text-white">{session.utilisateur.nom}</span>
        <span className="font-mono text-[12px] text-white/60">{session.utilisateur.telephone.replace(/^\+241(\d{3})(\d{2})(\d{2})(\d{2})$/, '$1 $2 $3 $4')}</span>
      </span>
      <button
        type="button"
        onClick={() => {
          deconnecter()
          router.push('/connexion')
        }}
        className="min-h-10 shrink-0 cursor-pointer rounded-lg border border-white/20 bg-transparent px-3 font-sans text-[13px] font-semibold text-white/85 hover:bg-white/10 hover:text-white"
      >
        Se déconnecter
      </button>
    </div>
  )
}

function Barres({ chemin }: { chemin: string | null }) {
  // Tiroir (téléphone) : ouvert pour une page donnée, il se referme de lui-même quand la page change.
  const [ouvertSur, setOuvertSur] = useState<string | null | undefined>(undefined)
  const tiroirOuvert = ouvertSur !== undefined && ouvertSur === chemin

  useEffect(() => {
    const ouvrir = () => setOuvertSur(window.location.pathname)
    window.addEventListener(EVENEMENT_OUVRIR_MENU, ouvrir)
    return () => window.removeEventListener(EVENEMENT_OUVRIR_MENU, ouvrir)
  }, [])

  return (
    <>
      <aside data-visite="menu" className="fixed inset-y-0 left-0 z-20 hidden w-72 lg:block">
        <Contenu chemin={chemin} />
      </aside>

      {tiroirOuvert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu de l'espace agriculteur"
          className="fixed inset-0 z-[80] lg:hidden"
          onKeyDown={(e) => e.key === 'Escape' && setOuvertSur(undefined)}
        >
          <button type="button" aria-label="Fermer le menu" onClick={() => setOuvertSur(undefined)} className="absolute inset-0 cursor-default border-0 bg-black/50" />
          <div className="absolute inset-y-0 left-0 w-[min(320px,88vw)] shadow-2xl">
            <Contenu chemin={chemin} surFermeture={() => setOuvertSur(undefined)} />
          </div>
        </div>
      )}
    </>
  )
}

function BarresAvecChemin() {
  return <Barres chemin={usePathname()} />
}

export default function Sidebar() {
  return (
    <Suspense fallback={<Barres chemin={null} />}>
      <BarresAvecChemin />
    </Suspense>
  )
}
