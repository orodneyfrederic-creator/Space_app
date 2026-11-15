import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import AgentFlottant from "@/components/agent/AgentFlottant";
import { COULEURS, MARQUE } from "@/lib/marque";
import "./globals.css";

// Polices officielles de la charte S'STACK, servies depuis le projet (app/fonts/, licence OFL) :
// pas de dépendance à Google Fonts, rendu identique en ligne et hors ligne.
// Outfit = textes et titres ; JetBrains Mono = chiffres, mesures et données NASA.
const outfit = localFont({
  variable: "--font-outfit",
  display: "swap",
  src: [
    { path: "./fonts/Outfit-Light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/Outfit-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Outfit-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Outfit-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Outfit-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/Outfit-ExtraBold.ttf", weight: "800", style: "normal" },
  ],
});

const jetbrainsMono = localFont({
  variable: "--font-jetbrains-mono",
  display: "swap",
  src: [
    { path: "./fonts/JetBrainsMono-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/JetBrainsMono-Bold.ttf", weight: "700", style: "normal" },
  ],
});

// Icônes (favicon.ico, icon.png, apple-icon.png), image de partage (opengraph-image.png)
// et manifeste (manifest.ts) sont dans app/ : Next.js les déclare tout seul.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: `${MARQUE.nom} · ${MARQUE.slogan}`, template: `%s · ${MARQUE.nom}` },
  description: MARQUE.description,
  applicationName: MARQUE.nom,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: MARQUE.nom,
    title: `${MARQUE.nom} · ${MARQUE.slogan}`,
    description: MARQUE.description,
  },
  twitter: { card: "summary_large_image", title: `${MARQUE.nom} · ${MARQUE.slogan}`, description: MARQUE.description },
};

export const viewport: Viewport = {
  themeColor: COULEURS.vertForet,
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
