'use client'
// Page « Mes graphiques » : les 30 derniers jours de la NASA, expliqués pour tout le monde.
// Chaque carte répond à UNE question simple : la réponse en une phrase, un graphique lisible,
// puis « Comment lire ce graphique ». Même lieu que l'accueil (GPS, point sur la carte ou ville).
// Les chiffres viennent de GET /api/etat-sol ; ici on ne fait que les montrer et les dire avec des mots.
// recharts : isAnimationActive={false} (sinon graphiques vides dans les captures).
import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  comparaisonChaleur,
  comparaisonEau,
  comparaisonPluie,
  degresArrondis,
  ETATS_COUCHE,
  jourCourt,
  millimetresArrondis,
  pourcent,
  TENDANCE_EAU,
} from '@/lib/etat-sol'
import type { EtatSol } from '@/lib/types'
import { useLieuSol } from '@/lib/use-lieu-sol'
import BandeauPosition from '../sol/BandeauPosition'
import { Erreur } from '../ui/elements'

const C = { terre: '#B4532A', racines: '#0B5D3B', profond: '#3A75C4', air: '#535B53', pluie: '#3A75C4', grille: '#E0D9C6', texte: '#535B53' }
const AXE = { tick: { fontSize: 12, fill: C.texte }, tickLine: false } as const
const virgule = (v: number) => (Math.round(v * 10) / 10).toString().replace('.', ',')
const BULLE = { borderRadius: 12, border: '1px solid #D2C9B1', fontFamily: 'var(--font-sans)', fontSize: 14, boxShadow: '0 6px 20px rgba(17,26,20,0.08)' }

// ── Éléments de mise en page ──

function Pastille({ couleur, trait = 'plein' }: { couleur: string; trait?: 'plein' | 'tirets' | 'barre' | 'zone' }) {
  if (trait === 'barre') return <span aria-hidden="true" className="inline-block h-4 w-3 shrink-0 rounded-sm" style={{ background: couleur }} />
  if (trait === 'zone') return <span aria-hidden="true" className="inline-block size-4 shrink-0 rounded" style={{ background: couleur }} />
  return (
    <span aria-hidden="true" className="inline-block w-6 shrink-0 border-t-[3px]" style={{ borderColor: couleur, borderTopStyle: trait === 'tirets' ? 'dashed' : 'solid' }} />
  )
}

function Lire({ children }: { children: ReactNode }) {
  return (
    <aside className="flex flex-col gap-3 rounded-2xl bg-pale p-4">
      <h3 className="m-0 font-display text-[15px] font-semibold text-ink">Comment lire ce graphique</h3>
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-[14px] leading-snug text-muted-2">{children}</ul>
    </aside>
  )
}

function Ligne({ pastille, children }: { pastille?: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      {pastille && <span className="mt-1.5 flex w-6 shrink-0 justify-center">{pastille}</span>}
      <span>{children}</span>
    </li>
  )
}

function Carte({ id, numero, question, reponse, ton, graphique, lecture, source }: {
  id: string
  numero: number
  question: string
  reponse: ReactNode
  ton: 'bleu' | 'vert' | 'ocre'
  graphique: ReactNode
  lecture: ReactNode
  source: string
}) {
  const fond = ton === 'bleu' ? 'bg-info-soft text-info-ink' : ton === 'vert' ? 'bg-accent-soft text-accent' : 'bg-risk-bg text-risk'
  return (
    <section id={id} aria-labelledby={`${id}-titre`} className="scroll-mt-6 flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 sm:p-7">
      <header className="flex flex-col gap-3">
        <p className="m-0 font-mono text-[12px] tracking-widest text-muted uppercase">Question {numero} sur 3</p>
        <h2 id={`${id}-titre`} className="m-0 font-display text-[24px] leading-tight font-semibold tracking-[-0.02em] text-ink sm:text-[28px]">
          {question}
        </h2>
        <div className={`rounded-2xl px-4 py-3 text-[17px] leading-snug ${fond}`}>{reponse}</div>
      </header>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <figure className="m-0 flex min-w-0 flex-col gap-2">
          <div className="h-72 w-full sm:h-80">{graphique}</div>
          <figcaption className="text-[12px] text-muted">Source : satellites de la NASA ({source}), zone d&apos;environ 50 km. Un point = un jour.</figcaption>
        </figure>
        {lecture}
      </div>
    </section>
  )
}

/** Nom en bout de ligne (seulement sur le dernier point) */
function etiquetteFin(nom: string, couleur: string, dernier: number, decalage = 0) {
  return function Etiquette(props: { x?: number | string; y?: number | string; index?: number }) {
    if (props.index !== dernier || props.x === undefined || props.y === undefined) return null
    return (
      <text x={Number(props.x) + 8} y={Number(props.y) + 4 + decalage} fontSize={12} fontWeight={700} fill={couleur}>
        {nom}
      </text>
    )
  }
}

// ── Les trois cartes ──

function CartePluie({ etat }: { etat: EtatSol }) {
  const jours = etat.serie.map((p) => ({ date: p.date, pluie: p.pluie }))
  const connus = jours.filter((j): j is { date: string; pluie: number } => j.pluie !== null)
  const joursDePluie = connus.filter((j) => j.pluie >= 1).length
  const plusGros = connus.reduce<{ date: string; pluie: number } | null>((m, j) => (m === null || j.pluie > m.pluie ? j : m), null)
  return (
    <Carte
      id="pluie"
      numero={1}
      question="A-t-il plu ces derniers temps ?"
      ton="bleu"
      reponse={
        <>
          <strong>{millimetresArrondis(etat.pluie7)} cette semaine.</strong> {comparaisonPluie(etat.ecartPluie7)} Sur 30 jours, il a plu {joursDePluie} jour{joursDePluie > 1 ? 's' : ''}
          {plusGros && plusGros.pluie >= 1 ? ` ; la plus grosse pluie : ${Math.round(plusGros.pluie)} mm le ${jourCourt(plusGros.date).replace(/\.$/, '')}.` : '.'}
        </>
      }
      source="PRECTOTCORR"
      graphique={
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={jours} margin={{ top: 10, right: 8, bottom: 0, left: -6 }}>
            <CartesianGrid stroke={C.grille} vertical={false} />
            <XAxis dataKey="date" tickFormatter={jourCourt} minTickGap={36} axisLine={{ stroke: '#D2C9B1' }} {...AXE} />
            <YAxis allowDecimals={false} axisLine={false} width={62} tickFormatter={(v: number) => `${v} mm`} {...AXE} />
            <Tooltip
              cursor={{ fill: '#EFEADD' }}
              contentStyle={BULLE}
              labelFormatter={(d) => `Le ${jourCourt(String(d))}`}
              formatter={(v) => [v === null || v === undefined ? 'pas encore publiée' : `${virgule(Number(v))} mm`, 'Pluie']}
            />
            <Bar dataKey="pluie" fill={C.pluie} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      }
      lecture={
        <Lire>
          <Ligne pastille={<Pastille couleur={C.pluie} trait="barre" />}>Chaque barre bleue, c&apos;est <strong>la pluie d&apos;un jour</strong>.</Ligne>
          <Ligne>Plus la barre est <strong>haute</strong>, plus il a plu ce jour-là.</Ligne>
          <Ligne>Pas de barre = <strong>pas de pluie</strong> ce jour-là.</Ligne>
          <Ligne>À gauche : il y a un mois. À droite : <strong>les jours les plus récents</strong>.</Ligne>
          <Ligne>Repère : <strong>20 mm en 3 jours</strong>, c&apos;est assez de pluie pour commencer à planter.</Ligne>
        </Lire>
      }
    />
  )
}

function CarteEau({ etat }: { etat: EtatSol }) {
  const donnees = etat.serie.map((p) => ({
    date: p.date,
    surface: p.surface === null ? null : Math.round(p.surface * 100),
    racines: p.racines === null ? null : Math.round(p.racines * 100),
    profondeur: p.profondeur === null ? null : Math.round(p.profondeur * 100),
  }))
  const dernier = donnees.length - 1
  const racines = etat.couches.find((c) => c.nom === 'racines')
  const ecart = racines && racines.indice !== null && racines.normale !== null ? Math.round((racines.indice - racines.normale) * 100) : null
  const noms: Record<string, string> = { surface: 'Dessus', racines: 'Racines', profondeur: 'Profond' }
  // Les 3 noms en bout de ligne ne doivent pas se chevaucher : on les écarte selon l'ordre des dernières valeurs
  const fin = donnees.at(-1)
  const ordre = (['surface', 'racines', 'profondeur'] as const)
    .map((k) => ({ k, v: fin?.[k] ?? 0 }))
    .sort((a, b) => b.v - a.v)
    .map((e) => e.k)
  const decalage = (k: 'surface' | 'racines' | 'profondeur') => {
    const rang = ordre.indexOf(k)
    const ecartMax = Math.max(...ordre.map((x) => fin?.[x] ?? 0)) - Math.min(...ordre.map((x) => fin?.[x] ?? 0))
    return ecartMax > 12 ? 0 : (rang - 1) * 14 // valeurs proches : -14, 0, +14 px
  }
  return (
    <Carte
      id="eau"
      numero={2}
      question="Y a-t-il assez d'eau dans ma terre ?"
      ton="vert"
      reponse={
        racines && racines.indice !== null ? (
          <>
            <strong>
              Autour des racines, la terre est {ETATS_COUCHE[racines.etat]} ({pourcent(racines.indice)}).
            </strong>{' '}
            {comparaisonEau(ecart)} {racines.tendance7j ? TENDANCE_EAU[racines.tendance7j] : ''}
          </>
        ) : (
          'Les chiffres de la NASA ne sont pas encore arrivés.'
        )
      }
      source="GWETTOP, GWETROOT, GWETPROF"
      graphique={
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={donnees} margin={{ top: 10, right: 70, bottom: 0, left: -6 }}>
            {/* Trois zones de fond : sèche, bonne humidité, très mouillée (seuils S'STACK) */}
            <ReferenceArea y1={0} y2={40} fill="#F5E0D5" fillOpacity={0.7} label={{ value: 'sèche', position: 'insideTopLeft', fontSize: 12, fill: '#8E3F1E' }} />
            <ReferenceArea y1={40} y2={70} fill="#DCEBE2" fillOpacity={0.7} label={{ value: 'bonne humidité', position: 'insideTopLeft', fontSize: 12, fill: '#0B5D3B' }} />
            <ReferenceArea y1={70} y2={100} fill="#DEE8F6" fillOpacity={0.8} label={{ value: 'très mouillée', position: 'insideTopLeft', fontSize: 12, fill: '#2A5A9C' }} />
            <XAxis dataKey="date" tickFormatter={jourCourt} minTickGap={36} axisLine={{ stroke: '#D2C9B1' }} {...AXE} />
            <YAxis domain={[0, 100]} ticks={[0, 40, 70, 100]} axisLine={false} width={56} tickFormatter={(v: number) => `${v} %`} {...AXE} />
            <Tooltip
              contentStyle={BULLE}
              labelFormatter={(d) => `Le ${jourCourt(String(d))}`}
              formatter={(v, nom) => [v === null || v === undefined ? 'pas encore publiée' : `${v} % d'eau`, noms[String(nom)] ?? String(nom)]}
            />
            <Line dataKey="surface" stroke={C.terre} strokeWidth={2} dot={false} isAnimationActive={false}>
              <LabelList dataKey="surface" content={etiquetteFin('Dessus', C.terre, dernier, decalage('surface'))} />
            </Line>
            <Line dataKey="profondeur" stroke={C.profond} strokeWidth={2} dot={false} isAnimationActive={false}>
              <LabelList dataKey="profondeur" content={etiquetteFin('Profond', C.profond, dernier, decalage('profondeur'))} />
            </Line>
            <Line dataKey="racines" stroke={C.racines} strokeWidth={4} dot={false} isAnimationActive={false}>
              <LabelList dataKey="racines" content={etiquetteFin('Racines', C.racines, dernier, decalage('racines'))} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      }
      lecture={
        <Lire>
          <Ligne pastille={<Pastille couleur={C.racines} />}>
            La <strong>grosse ligne verte</strong> : l&apos;eau autour des racines. C&apos;est la plus importante pour vos boutures.
          </Ligne>
          <Ligne pastille={<Pastille couleur={C.terre} />}>La ligne marron : le dessus de la terre. Elle bouge vite après une pluie.</Ligne>
          <Ligne pastille={<Pastille couleur={C.profond} />}>La ligne bleue : l&apos;eau en profondeur, la réserve. Elle bouge lentement.</Ligne>
          <Ligne pastille={<Pastille couleur="#DCEBE2" trait="zone" />}>
            Le fond vous dit l&apos;état : <strong>marron = sèche</strong>, <strong>vert = bonne</strong>, <strong>bleu = très mouillée</strong>.
          </Ligne>
          <Ligne>0 % = terre toute sèche, 100 % = terre pleine d&apos;eau.</Ligne>
        </Lire>
      }
    />
  )
}

function CarteChaleur({ etat }: { etat: EtatSol }) {
  const donnees = etat.serie.map((p) => ({ date: p.date, terre: p.tempSurface, air: p.tmax }))
  const dernier = donnees.length - 1
  const t = etat.tempSurface
  const valeurs = donnees.flatMap((d) => [d.terre, d.air]).filter((v): v is number => v !== null)
  const bas = valeurs.length ? Math.floor(Math.min(...valeurs) - 2) : 15
  const haut = valeurs.length ? Math.ceil(Math.max(...valeurs) + 2) : 40
  return (
    <Carte
      id="chaleur"
      numero={3}
      question="Fait-il chaud pour mes cultures ?"
      ton="ocre"
      reponse={
        <>
          <strong>La terre est à {degresArrondis(t.actuelle)}.</strong> {comparaisonChaleur(t.actuelle, t.normale)}
        </>
      }
      source="TS, T2M_MAX"
      graphique={
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={donnees} margin={{ top: 10, right: 56, bottom: 0, left: -6 }}>
            <CartesianGrid stroke={C.grille} vertical={false} />
            <XAxis dataKey="date" tickFormatter={jourCourt} minTickGap={36} axisLine={{ stroke: '#D2C9B1' }} {...AXE} />
            <YAxis domain={[bas, haut]} allowDecimals={false} axisLine={false} width={60} tickFormatter={(v: number) => `${v} °C`} {...AXE} />
            <Tooltip
              contentStyle={BULLE}
              labelFormatter={(d) => `Le ${jourCourt(String(d))}`}
              formatter={(v, nom) => [v === null || v === undefined ? 'pas encore publiée' : `${virgule(Number(v))} °C`, nom === 'terre' ? 'Terre' : 'Air (le plus chaud du jour)']}
            />
            <Line dataKey="air" stroke={C.air} strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false}>
              <LabelList dataKey="air" content={etiquetteFin('Air', C.air, dernier)} />
            </Line>
            <Line dataKey="terre" stroke={C.terre} strokeWidth={4} dot={false} isAnimationActive={false}>
              <LabelList dataKey="terre" content={etiquetteFin('Terre', C.terre, dernier)} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      }
      lecture={
        <Lire>
          <Ligne pastille={<Pastille couleur={C.terre} />}>
            La <strong>grosse ligne marron</strong> : la chaleur du dessus de la terre, vue par satellite.
          </Ligne>
          <Ligne pastille={<Pastille couleur={C.air} trait="tirets" />}>Les tirets gris : l&apos;air, au moment le plus chaud de la journée.</Ligne>
          <Ligne>Plus la ligne est <strong>haute</strong>, plus il fait chaud.</Ligne>
          <Ligne>Une terre très chaude <strong>sèche plus vite</strong> : regardez aussi la question 2.</Ligne>
        </Lire>
      }
    />
  )
}

export default function VueGraphiques() {
  const lieuSol = useLieuSol()
  const { etatSol } = lieuSol
  const etat = etatSol.statut === 'pret' ? etatSol.donnees : null
  const debut = etat?.serie[0]?.date
  const fin = etat?.serie.at(-1)?.date

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-[28px] font-semibold tracking-[-0.02em] text-ink sm:text-[34px]">Mes graphiques</h1>
        <p className="m-0 max-w-2xl text-[16px] leading-relaxed text-muted-2">
          Ce qui s&apos;est passé dans votre champ ces 30 derniers jours{debut && fin ? ` (du ${jourCourt(debut)} au ${jourCourt(fin)})` : ''}, en trois questions.
          Touchez un graphique pour voir le chiffre d&apos;un jour.
        </p>
        <nav aria-label="Aller à une question" className="mt-1 flex flex-wrap gap-2">
          {[
            ['#pluie', 'A-t-il plu ?'],
            ['#eau', 'Assez d\'eau dans la terre ?'],
            ['#chaleur', 'Fait-il chaud ?'],
          ].map(([href, texte]) => (
            <a key={href} href={href} className="flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-[14px] font-semibold text-accent no-underline hover:border-accent">
              {texte}
            </a>
          ))}
        </nav>
      </header>

      <BandeauPosition
        lieu={lieuSol.lieu}
        etatSol={etat}
        localisation={lieuSol.localisation}
        sites={lieuSol.sites}
        localiser={lieuSol.localiser}
        placer={lieuSol.placer}
        choisirVille={lieuSol.choisirVille}
      />

      {lieuSol.erreurSites && <Erreur message={lieuSol.erreurSites} onReessayer={lieuSol.rechargerSites} />}
      {etatSol.statut === 'erreur' && <Erreur message={etatSol.message} onReessayer={etatSol.recharger} />}
      {etatSol.statut === 'chargement' && (
        <div aria-hidden="true" className="flex flex-col gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[420px] animate-pulse rounded-3xl bg-line-soft" />
          ))}
        </div>
      )}

      {etat && etat.serie.length === 0 && (
        <p className="m-0 rounded-3xl bg-surface p-6 text-[16px] text-muted-2">La NASA n&apos;a pas encore publié de chiffres pour cette zone. Réessayez plus tard, ou choisissez un autre lieu.</p>
      )}
      {etat && etat.serie.length > 0 && (
        <>
          <CartePluie etat={etat} />
          <CarteEau etat={etat} />
          <CarteChaleur etat={etat} />
        </>
      )}
    </div>
  )
}
