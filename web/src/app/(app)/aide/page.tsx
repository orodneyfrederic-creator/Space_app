// Centre d'aide (page à venir, entrée du bas de la sidebar).
import type { Metadata } from 'next'
import { CENTRE_AIDE } from '@/components/navigation/menu'
import VuePageAVenir from '@/components/vues/VuePageAVenir'

export const metadata: Metadata = { title: "Centre d'aide · S'STACK" }

export default function CentreAide() {
  return <VuePageAVenir page={CENTRE_AIDE} />
}
