import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}>
      <body>
        <div className="screen">
          {children}
          <TabBar />
        </div>
      </body>
    </html>
  );
}
