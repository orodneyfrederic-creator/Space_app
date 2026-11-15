'use client'
// Sidebar de l'espace agriculteur (« Farm Intelligence »), d'après le croquis de l'équipe.
// Organisation (menu.ts) : « Au quotidien » (pages prêtes, un clic), « Mes données » (climat, sol),
// « Bientôt disponible » (pages en préparation, replié), puis aide, paramètres et compte en pied.
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
import { IcoChevron, IcoEtoile, IcoFermer } from '../landing/icones'
import Logo from './Logo'
import { useProfil } from '@/lib/profil'
import { BIENTOT, estPageActive, EVENEMENT_OUVRIR_MENU, menuPour, type PageMenu, type Rubrique } from './menu'

type ProprietesEntree = {
  page: PageMenu
  chemin: string | null
  icone?: ReactNode
  /** Entrée principale (agent) : liseré Jaune Soleil quand elle n'est pas active */
  miseEnAvant?: boolean
  /** Affiche le badge « Bientôt » sur les pages à venir */
  badgeAVenir?: boolean
}

function Entree({ page, chemin, icone, miseEnAvant = false, badgeAVenir = false }: ProprietesEntree) {
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
        actif
          ? 'bg-white/12 font-semibold text-white'
          : miseEnAvant
            ? 'font-semibold text-white ring-1 ring-pousse/45 hover:bg-white/6'
            : page.aVenir
              ? 'text-white/50 hover:bg-white/6 hover:text-white/80'
              : 'text-white/75 hover:bg-white/6 hover:text-white'
      }`}
    >
      {icone && <span className={actif || miseEnAvant ? 'text-pousse' : 'text-menthe-pale/80'}>{icone}</span>}
      <span className="min-w-0 flex-1 truncate">{page.titre}</span>
      {badgeAVenir && page.aVenir && (
        <span className="shrink-0 rounded-full bg-white/8 px-2 py-0.5 text-[10.5px] font-medium text-white/55">Bientôt</span>
      )}
      {actif && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-pousse" />}
    </Link>
      )}
    </Survol>
  )
}

type ProprietesGroupe = { rubrique: Rubrique; chemin: string | null; ouvert: boolean; surBascule: () => void; badgeAVenir?: boolean }

function GroupeRubrique({ rubrique, chemin, ouvert, surBascule, badgeAVenir = false }: ProprietesGroupe) {
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
        className={`flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-left font-sans text-[14px] font-medium transition-colors hover:bg-white/6 ${
          contientActive ? 'font-semibold text-white' : 'text-white/75 hover:text-white'
        }`}
      >
        <span className={contientActive ? 'text-pousse' : 'text-menthe-pale/80'}><Icone taille={18} /></span>
        <span className="min-w-0 flex-1">{rubrique.titre}</span>
        <span className={`text-white/50 transition-transform duration-200 ${ouvert ? 'rotate-180' : ''}`}><IcoChevron /></span>
      </button>
      <ul id={idListe} hidden={!ouvert} className="m-0 mt-0.5 mb-2 ml-[22px] flex list-none flex-col gap-0.5 border-l border-white/12 p-0 pl-3">
        {rubrique.pages.map((p) => (
          <li key={p.href}>
            <Entree page={p} chemin={chemin} badgeAVenir={badgeAVenir} />
          </li>
        ))}
      </ul>
    </li>
  )
}

const TitreSection = ({ children }: { children: ReactNode }) => (
  <p className="m-0 px-3 pt-4 pb-1 text-[10.5px] font-semibold tracking-[0.14em] text-white/45 uppercase first:pt-0">{children}</p>
)

/** Pages en préparation : un seul bloc replié, pour ne pas mener vers des pages vides sans prévenir. */
function BlocBientot({ chemin, ouvert, surBascule }: { chemin: string | null; ouvert: boolean; surBascule: () => void }) {
  const total = BIENTOT.reduce((n, r) => n + r.pages.length, 0)
  return (
    <div className="mt-4 border-t border-white/10 pt-3">
      <button
        type="button"
        onClick={surBascule}
        aria-expanded={ouvert}
        aria-controls="menu-bientot"
        className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-left font-sans text-[14px] font-medium text-white/60 transition-colors hover:bg-white/6 hover:text-white"
      >
        <span className="text-menthe-pale/60"><IcoEtoile taille={18} /></span>
        <span className="min-w-0 flex-1">Bientôt disponible</span>
        <span className="rounded-full bg-white/8 px-2 py-0.5 font-mono text-[11px] text-white/55">{total}</span>
        <span className={`text-white/50 transition-transform duration-200 ${ouvert ? 'rotate-180' : ''}`}><IcoChevron /></span>
      </button>
      <div id="menu-bientot" hidden={!ouvert} className="mt-1 ml-[22px] flex flex-col gap-2 border-l border-white/12 pl-3">
        {BIENTOT.map((r) => (
          <div key={r.id} className="flex flex-col gap-0.5">
            <p className="m-0 px-3 pt-1 text-[11px] font-semibold text-white/40">{r.titre}</p>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {r.pages.map((p) => (
                <li key={p.href}>
                  <Entree page={p} chemin={chemin} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function Contenu({ chemin, surFermeture }: { chemin: string | null; surFermeture?: () => void }) {
  // Rubrique dépliée par la personne ; sinon, celle qui contient la page en cours.
  const [bascules, setBascules] = useState<Record<string, boolean>>({})
  const menu = menuPour(useProfil())
  const estOuverte = (r: Rubrique) => bascules[r.id] ?? (chemin !== null && r.pages.some((p) => estPageActive(chemin, p)))
  const basculer = (r: Rubrique) => setBascules((b) => ({ ...b, [r.id]: !estOuverte(r) }))
  // « Bientôt disponible » : replié, sauf si la page en cours en fait partie
  const bientotOuvert = bascules.bientot ?? (chemin !== null && BIENTOT.some((r) => r.pages.some((p) => estPageActive(chemin, p))))

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
        <TitreSection>Au quotidien</TitreSection>
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
          {menu.quotidien.map((e) => (
            <li key={e.href}>
              <Entree page={e} chemin={chemin} icone={<e.icone taille={18} />} miseEnAvant={e.miseEnAvant} />
            </li>
          ))}
        </ul>

        {menu.mesDonnees.length > 0 && (
          <>
            <TitreSection>Mes données</TitreSection>
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {menu.mesDonnees.map((r) => (
                <GroupeRubrique key={r.id} rubrique={r} chemin={chemin} ouvert={estOuverte(r)} surBascule={() => basculer(r)} badgeAVenir />
              ))}
            </ul>
          </>
        )}

        {menu.bientot.length > 0 && (
          <BlocBientot chemin={chemin} ouvert={bientotOuvert} surBascule={() => setBascules((b) => ({ ...b, bientot: !bientotOuvert }))} />
        )}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-white/10 px-3 py-3">
        {/* Visite guidée en premier : c'est le point de départ d'un nouveau producteur */}
        <BoutonVisite className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-lg border-0 bg-transparent px-3 text-left font-sans text-[14px] text-white/75 transition-colors hover:bg-white/6 hover:text-white">
          <span className="text-menthe-pale/80"><IcoVisite /></span>
          Visite guidée
        </BoutonVisite>
        {menu.aide && <Entree page={menu.aide} chemin={chemin} icone={<menu.aide.icone taille={18} />} />}
        <ul className="m-0 list-none p-0">
          <GroupeRubrique rubrique={menu.parametres} chemin={chemin} ouvert={estOuverte(menu.parametres)} surBascule={() => basculer(menu.parametres)} />
        </ul>
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
