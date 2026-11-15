// Page d'attente d'une entrée du menu qui n'a pas encore de contenu.
// Dit honnêtement ce que la page contiendra, et propose les pages déjà disponibles de la même rubrique.
import Link from 'next/link'
import BoutonAgent from '../agent/BoutonAgent'
import { NOM_AGENT } from '../agent/questions'
import { IcoFleche } from '../landing/icones'
import type { PageMenu, Rubrique } from '../navigation/menu'
import { EnTetePage } from '../ui/elements'

export default function VuePageAVenir({ rubrique, page }: { rubrique?: Pick<Rubrique, 'titre' | 'icone' | 'pages'>; page: PageMenu & { icone?: Rubrique['icone'] } }) {
  const Icone = rubrique?.icone ?? page.icone
  const disponibles = rubrique?.pages.filter((p) => !p.aVenir) ?? []

  return (
    <>
      <EnTetePage titre={page.titre} sousTitre={rubrique?.titre} />
      <section className="flex flex-col items-start gap-5 rounded-[20px] border border-dashed border-line bg-surface p-6 md:p-8">
        {Icone && (
          <span className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Icone taille={24} />
          </span>
        )}
        <div className="flex flex-col gap-2">
          <span className="self-start rounded-full bg-warn-bg px-2.5 py-1 text-[11px] font-semibold text-warn-ink">Bientôt disponible</span>
          <h2 className="m-0 font-display text-xl font-semibold">Cette page est en préparation</h2>
          <p className="m-0 max-w-[60ch] text-[15px] leading-relaxed text-muted-2">{page.description}</p>
        </div>

        {disponibles.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-sm font-semibold text-ink">Déjà disponible dans « {rubrique?.titre} » :</p>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {disponibles.map((p) => (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    className="flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium text-ink no-underline hover:border-accent hover:bg-accent-soft"
                  >
                    {p.titre} <IcoFleche taille={14} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <BoutonAgent className="flex min-h-11 items-center rounded-xl border-0 bg-accent px-4 font-sans text-sm font-semibold text-white hover:bg-accent-hover">
          Une question en attendant ? Demander à {NOM_AGENT}
        </BoutonAgent>
      </section>
    </>
  )
}
