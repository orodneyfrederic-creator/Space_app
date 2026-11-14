'use client'
// Historique des conseils donnés sur le web et sur Telegram (lu dans Supabase par le serveur).
import { listerConseils } from '@/lib/api'
import { useApi } from '@/lib/use-api'
import ListeConseils from '../historique/ListeConseils'
import { Chargement, EnTetePage, Erreur } from '../ui/elements'

export default function VueHistorique() {
  const conseils = useApi(() => listerConseils(50), 'conseils:50')
  return (
    <div className="mx-auto max-w-[860px]">
      <EnTetePage titre="Historique des conseils" sousTitre="Les 50 derniers conseils, web et Telegram" />
      {conseils.statut === 'chargement' && <Chargement texte="Chargement de l'historique…" />}
      {conseils.statut === 'erreur' && <Erreur message={conseils.message} onReessayer={conseils.recharger} />}
      {conseils.statut === 'pret' && <ListeConseils conseils={conseils.donnees} />}
    </div>
  )
}
