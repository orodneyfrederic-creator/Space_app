import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import NavLaterale from "@/components/navigation/NavLaterale";
import TabBar from "@/components/TabBar";
import "./globals.css";

// Polices de la charte S'STACK
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "S'STACK",
  description: "Conseils agricoles pour les producteurs gabonais, à partir des données NASA.",
};

export const viewport: Viewport = {
  themeColor: "#0B5D3B",
};

// Téléphone : contenu + barre d'onglets en bas.
// Tablette et ordinateur (≥ 768 px) : barre latérale à gauche + contenu large et centré.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}>
      <body>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
        >
          Aller au contenu
        </a>
        <NavLaterale />
        <div className="md:pl-60">
          <div id="contenu" className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-28 sm:px-6 md:px-8 md:pt-10 md:pb-12 lg:px-10">
            {children}
          </div>
        </div>
        <TabBar />
      </body>
    </html>
  );
}
