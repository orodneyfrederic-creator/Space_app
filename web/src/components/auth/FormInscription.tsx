'use client'
// Formulaire d'inscription : nom, numéro de téléphone, profil, ville, mot de passe (POST /api/auth/inscription).
// En cas de succès : session gardée, ville retenue pour le tableau de bord, puis page /bienvenue
// (qui présente le bot Telegram).
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ErreurApi, getSites, inscrire } from '@/lib/api'
import { SITE_PAR_DEFAUT, useSiteChoisi } from '@/lib/site-choisi'
import { useApi } from '@/lib/use-api'
import type { Profil } from '@/lib/types'
import ChampMotDePasse from './ChampMotDePasse'
import ChoixProfil from './ChoixProfil'
import { AIDE_TELEPHONE, CLASSE_BOUTON_PRINCIPAL, CLASSE_CHAMP, Etiquette, MessageErreur } from './formulaire'

export default function FormInscription() {
  const router = useRouter()
  const [siteId, choisir] = useSiteChoisi()
  const sites = useApi(getSites, 'sites')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [profil, setProfil] = useState<Profil>('producteur')

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-5"
        onSubmit={async (e) => {
          e.preventDefault()
          const champs = new FormData(e.currentTarget)
          const texte = (nom: string) => String(champs.get(nom) ?? '')
          const site = texte('site')
          setErreur(null)
          setEnvoi(true)
          try {
            await inscrire({ nom: texte('nom'), telephone: texte('telephone'), motDePasse: texte('motDePasse'), profil, ...(site ? { siteId: site } : {}) })
            if (site) choisir(site)
            router.push('/bienvenue')
          } catch (err) {
            setErreur(err instanceof ErreurApi ? err.message : 'Une erreur inattendue est survenue. Réessayez.')
            setEnvoi(false)
          }
        }}
      >
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="inscription-nom">Nom complet</Etiquette>
          <input id="inscription-nom" name="nom" type="text" required minLength={2} maxLength={60} autoComplete="name" placeholder="Prénom Nom" className={CLASSE_CHAMP} />
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="inscription-tel">Numéro de téléphone</Etiquette>
          <input
            id="inscription-tel"
            name="telephone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            placeholder="077 12 34 56"
            aria-describedby="inscription-tel-aide"
            className={CLASSE_CHAMP}
          />
          <p id="inscription-tel-aide" className="m-0 text-[13px] leading-relaxed text-ardoise">
            {AIDE_TELEPHONE}. Utilisez le numéro de votre compte Telegram : vous pourrez aussi poser vos questions au bot.
          </p>
        </div>
        <ChoixProfil name="profil" valeur={profil} onChange={setProfil} />
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="inscription-site">Site le plus proche de vos champs</Etiquette>
          <select
            id="inscription-site"
            name="site"
            defaultValue={siteId || SITE_PAR_DEFAUT}
            key={sites.statut}
            disabled={sites.statut !== 'pret'}
            className={`${CLASSE_CHAMP} cursor-pointer disabled:cursor-wait disabled:bg-pale`}
          >
            {sites.statut === 'pret' ? (
              sites.donnees.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)
            ) : (
              <option value="">{sites.statut === 'chargement' ? 'Chargement des sites…' : 'Sites indisponibles pour le moment'}</option>
            )}
          </select>
          {sites.statut === 'erreur' && (
            <p className="m-0 text-[13px] text-risk">
              {sites.message}{' '}
              <button type="button" onClick={sites.recharger} className="cursor-pointer border-0 bg-transparent p-0 font-sans text-[13px] font-semibold text-cnx underline">
                Réessayer
              </button>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="inscription-mdp">Mot de passe (8 caractères minimum)</Etiquette>
          <ChampMotDePasse id="inscription-mdp" autoComplete="new-password" />
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-relaxed text-ardoise">
          <input type="checkbox" name="accord" required className="mt-1 size-5 shrink-0 cursor-pointer accent-cnx" />
          J&apos;ai compris que S&apos;STACK donne des repères à partir des données NASA, à confirmer sur le terrain, et non des garanties de récolte.
        </label>
        <MessageErreur message={erreur} />
        <button type="submit" disabled={envoi} className={CLASSE_BOUTON_PRINCIPAL}>
          {envoi ? 'Création du compte…' : 'Créer mon compte'}
        </button>
      </form>

      <p className="m-0 text-center text-[15px] text-ardoise">
        Déjà un compte ?{' '}
        <Link href="/connexion" className="font-semibold text-cnx no-underline hover:text-vif-hover">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
