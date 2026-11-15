import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import { Suspense } from "react";
import AgentFlottant from "@/components/agent/AgentFlottant";
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

// Layout racine : polices et <html> seulement.
// La landing (app/page.tsx) s'affiche en pleine largeur ; les pages de l'application
// (groupe (app)/) ajoutent la barre latérale et la barre d'onglets dans leur propre layout.
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
        {children}
        {/* Agent flottant sur toutes les pages ; reste monté pendant la navigation (conversation conservée) */}
        <Suspense fallback={null}>
          <AgentFlottant />
        </Suspense>
      </body>
    </html>
  );
}
