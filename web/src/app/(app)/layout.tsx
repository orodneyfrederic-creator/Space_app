// Espace agriculteur (tableau de bord, carte, données… et les pages à venir du menu).
// Ordinateur (≥ 1024 px) : sidebar « Farm Intelligence » fixe à gauche + contenu large et centré.
// Téléphone et tablette : contenu + barre d'onglets en bas, dont « Menu » ouvre la sidebar en tiroir.
import Sidebar from '@/components/navigation/Sidebar'
import TabBar from '@/components/TabBar'

export default function LayoutApplication({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <div className="lg:pl-72">
        <div id="contenu" className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-28 sm:px-6 md:px-8 md:pt-10 lg:px-10 lg:pb-12">
          {children}
        </div>
      </div>
      <TabBar />
    </>
  )
}
