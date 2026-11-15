// Icônes de la landing (même trait que components/icons.tsx, avec une taille réglable).
import type { ReactNode } from 'react'

function Icone({ taille = 20, epaisseur = 2, children }: { taille?: number; epaisseur?: number; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={epaisseur}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {children}
    </svg>
  )
}

type P = { taille?: number }

export const IcoCoche = ({ taille = 14 }: P) => <Icone taille={taille}><path d="m5 12 5 5L20 7" /></Icone>
export const IcoFleche = ({ taille = 16 }: P) => <Icone taille={taille}><path d="M5 12h14M13 6l6 6-6 6" /></Icone>
export const IcoFlecheGauche = ({ taille = 16 }: P) => <Icone taille={taille}><path d="M19 12H5M11 6l-6 6 6 6" /></Icone>
export const IcoDiagonale = ({ taille = 18 }: P) => <Icone taille={taille}><path d="M7 17 17 7M8 7h9v9" /></Icone>
export const IcoDiagonaleBas = ({ taille = 18 }: P) => <Icone taille={taille}><path d="M7 7l10 10M17 8v9H8" /></Icone>
export const IcoLecture = ({ taille = 16 }: P) => <Icone taille={taille}><path d="M8 5.5v13l10.5-6.5z" /></Icone>
export const IcoBulle = ({ taille = 18 }: P) => (
  <Icone taille={taille}><path d="M4 5h16v11H9l-5 4zM8 9.5h8M8 12.5h5" /></Icone>
)
export const IcoMenu = ({ taille = 22 }: P) => <Icone taille={taille}><path d="M4 7h16M4 12h16M4 17h16" /></Icone>
export const IcoCible = ({ taille = 20 }: P) => (
  <Icone taille={taille}><path d="M12 3 21 12 12 21 3 12z" /><circle cx="12" cy="12" r="2.5" /></Icone>
)
export const IcoSatellite = ({ taille = 20 }: P) => (
  <Icone taille={taille}>
    <path d="m13 7 4 4M6 14l4 4M9.5 10.5l4 4" />
    <path d="m11.5 8.5 3-3 4 4-3 3zM4.5 15.5l3-3 4 4-3 3z" />
    <path d="M17 17a4 4 0 0 0 4-4M17 21a8 8 0 0 0 8-8" />
  </Icone>
)
export const IcoPersonnes = ({ taille = 20 }: P) => (
  <Icone taille={taille}>
    <circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.2a5 5 0 0 1 5 5" />
  </Icone>
)
export const IcoRepere = ({ taille = 20 }: P) => (
  <Icone taille={taille}><path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Icone>
)
export const IcoSoleil = ({ taille = 22 }: P) => (
  <Icone taille={taille}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icone>
)
export const IcoNuage = ({ taille = 22 }: P) => (
  <Icone taille={taille}><path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 18z" /></Icone>
)
export const IcoPluie = ({ taille = 22 }: P) => (
  <Icone taille={taille}>
    <path d="M7 15h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7 15z" /><path d="M8 18.5 7 21M12 18.5 11 21M16 18.5 15 21" />
  </Icone>
)
export const IcoGraine = ({ taille = 20 }: P) => (
  <Icone taille={taille}><path d="M12 21v-8M12 13c0-4.5-3-7.5-8-7.5 0 4.5 3 7.5 8 7.5zM12 13c0-3.5 2.5-6 6.5-6 0 3.5-2.5 6-6.5 6z" /></Icone>
)
export const IcoGoutte = ({ taille = 20 }: P) => <Icone taille={taille}><path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z" /></Icone>
export const IcoCouches = ({ taille = 20 }: P) => (
  <Icone taille={taille}><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></Icone>
)
export const IcoCalendrier = ({ taille = 18 }: P) => (
  <Icone taille={taille}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></Icone>
)
export const IcoGraphique = ({ taille = 20 }: P) => (
  <Icone taille={taille}><path d="M4 20V11M10 20V5M16 20v-6M21 20H3" /></Icone>
)
export const IcoCarte = ({ taille = 20 }: P) => (
  <Icone taille={taille}><path d="m9 4-6 2.5v13.5l6-2.5 6 2.5 6-2.5V3.5L15 6z" /><path d="M9 4v13.5M15 6v13.5" /></Icone>
)
export const IcoHorloge = ({ taille = 20 }: P) => (
  <Icone taille={taille}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Icone>
)
export const IcoTableau = ({ taille = 20 }: P) => (
  <Icone taille={taille}><rect x="3" y="3" width="7.5" height="9" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="5" rx="1.5" /><rect x="13.5" y="11" width="7.5" height="10" rx="1.5" /><rect x="3" y="15" width="7.5" height="6" rx="1.5" /></Icone>
)
export const IcoFeuille = ({ taille = 20 }: P) => (
  <Icone taille={taille}><path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15zM5 19l7-7" /></Icone>
)
export const IcoEtoile = ({ taille = 20 }: P) => (
  <Icone taille={taille}><path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-2.9-5.4 2.9 1.1-6-4.5-4.2 6.1-.8z" /></Icone>
)
export const IcoBouclier = ({ taille = 20 }: P) => (
  <Icone taille={taille}><path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6z" /><path d="m9 12 2 2 4-4" /></Icone>
)
export const IcoMicro = ({ taille = 20 }: P) => (
  <Icone taille={taille}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></Icone>
)
export const IcoEnvoyer = ({ taille = 18 }: P) => <Icone taille={taille}><path d="M4 12 20 4l-4 16-4-6.5zM12 13.5 20 4" /></Icone>
export const IcoFermer = ({ taille = 18 }: P) => <Icone taille={taille}><path d="M6 6l12 12M18 6 6 18" /></Icone>
export const IcoMoins = ({ taille = 18 }: P) => <Icone taille={taille}><path d="M5 12h14" /></Icone>
export const IcoNouveau = ({ taille = 18 }: P) => (
  <Icone taille={taille}><path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" /><path d="M17.5 3.5a2.1 2.1 0 0 1 3 3L13 14l-4 1 1-4z" /></Icone>
)
export const IcoOeil = ({ taille = 20 }: P) => (
  <Icone taille={taille}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></Icone>
)
export const IcoOeilBarre = ({ taille = 20 }: P) => (
  <Icone taille={taille}><path d="M3 3l18 18M10.6 5.6A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.5M6.5 7.2C4 8.9 2.5 12 2.5 12S6 18.5 12 18.5c1.7 0 3.2-.5 4.5-1.2M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Icone>
)
export const IcoChevron = ({ taille = 16 }: P) => <Icone taille={taille}><path d="m6 9 6 6 6-6" /></Icone>
export const IcoPiece = ({ taille = 20 }: P) => (
  <Icone taille={taille}><ellipse cx="12" cy="6.5" rx="7" ry="3" /><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /></Icone>
)
export const IcoPresse = ({ taille = 20 }: P) => (
  <Icone taille={taille}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" /></Icone>
)
export const IcoReglages = ({ taille = 20 }: P) => (
  <Icone taille={taille}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </Icone>
)
export const IcoAide = ({ taille = 20 }: P) => (
  <Icone taille={taille}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.4M12 17h.01" /></Icone>
)
export const IcoGuillemets = ({ taille = 26 }: P) => (
  <svg aria-hidden="true" width={taille} height={taille} viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
    <path d="M4 18v-5.5C4 8.4 6 5.8 10 5l.6 1.6C8.4 7.4 7.3 9 7.2 11H10v7zm9.5 0v-5.5c0-4.1 2-6.7 6-7.5l.6 1.6c-2.2.8-3.3 2.4-3.4 4.4h2.8v7z" />
  </svg>
)
