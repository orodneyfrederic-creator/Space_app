'use client'
// Formulaire d'inscription. L'authentification n'est pas encore branchée :
// un formulaire valide garde seulement le site choisi (dans le navigateur, comme le sélecteur de site)
// puis ouvre le tableau de bord. Nom, e-mail et mot de passe ne sont ni envoyés ni enregistrés.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSites } from '@/lib/api'
import { SITE_PAR_DEFAUT, useSiteChoisi } from '@/lib/site-choisi'
import { useApi } from '@/lib/use-api'
import ChampMotDePasse from './ChampMotDePasse'
import { AvisAuthentification, CLASSE_BOUTON_PRINCIPAL, CLASSE_CHAMP, Etiquette } from './formulaire'

export default function FormInscription() {
  const router = useRouter()
  const [siteId, choisir] = useSiteChoisi()
  const sites = useApi(getSites, 'sites')

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          const site = new FormData(e.currentTarget).get('site')
          if (typeof site === 'string' && site) choisir(site)
          router.push('/tableau-de-bord')
        }}
      >
        <div className="flex flex-col gap-2">
          <Etiquette htmlFor="inscription-nom">Nom complet</Etiquette>
          <input id="inscription-nom" name="nom" type="text" required autoComplete="name" placeholder="Prénom Nom" className={CLASSE_CHAMP} />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Etiquette htmlFor="inscription-email">Adresse e-mail</Etiquette>
            <input id="inscription-email" name="email" type="email" required autoComplete="email" placeholder="vous@exemple.ga" className={CLASSE_CHAMP} />
          </div>
          <div className="flex flex-col gap-2">
            <Etiquette htmlFor="inscription-tel">Téléphone (facultatif)</Etiquette>
            <input id="inscription-tel" name="telephone" type="tel" autoComplete="tel" placeholder="+241 …" className={CLASSE_CHAMP} />
          </div>
        </div>
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
        <button type="submit" className={CLASSE_BOUTON_PRINCIPAL}>
          Créer mon compte
        </button>
      </form>

      <p className="m-0 text-center text-[15px] text-ardoise">
        Déjà un compte ?{' '}
        <Link href="/connexion" className="font-semibold text-cnx no-underline hover:text-profond">
          Se connecter
        </Link>
      </p>

      <AvisAuthentification />
    </div>
  )
}
