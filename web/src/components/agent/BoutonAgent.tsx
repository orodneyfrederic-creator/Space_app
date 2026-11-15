'use client'
// Bouton qui ouvre l'agent flottant (avec une question déjà posée, si `question` est donnée).
import type { ReactNode } from 'react'
import { ouvrirAgent } from './ouvrir'

export default function BoutonAgent({ question, className, children }: { question?: string; className?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={() => ouvrirAgent(question)} className={`cursor-pointer ${className ?? ''}`}>
      {children}
    </button>
  )
}
