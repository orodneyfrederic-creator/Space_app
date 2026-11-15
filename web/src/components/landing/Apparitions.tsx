'use client'
// Branche les apparitions au défilement sur toute la landing (les sections restent des composants serveur).
import { useApparition } from '@/lib/use-apparition'

export default function Apparitions() {
  useApparition()
  return null
}
