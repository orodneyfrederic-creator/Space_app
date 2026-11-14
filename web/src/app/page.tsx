// Page d'accueil / tableau de bord : vue d'ensemble pour coopératives, conseillers et jury.
// TODO (front-end) : résumé des parcelles (verdict de semis de chacune), accès rapide à la discussion.
import Link from 'next/link'
import { PARCELLES_DEMO } from '@/lib/donnees-demo'

export default function Accueil() {
  return (
    <main className="mx-auto w-full max-w-5xl p-4">
      <h1 className="text-3xl font-bold">S&apos;STACK : cultiver demain avec les données du ciel</h1>
      <p className="mt-2">Quand planter, quoi planter, quand laisser reposer sa parcelle, grâce aux données NASA.</p>
      <h2 className="mt-6 text-xl font-semibold">Parcelles suivies</h2>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {PARCELLES_DEMO.map((p) => (
          <li key={p.id}>
            <Link href={`/parcelles/${p.id}`} className="block rounded-xl border p-3 hover:underline">
              {p.nom}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
