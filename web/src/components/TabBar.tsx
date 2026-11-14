"use client";
// Barre de navigation commune à toutes les pages (affichée par app/layout.tsx).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartIcon, ChatIcon, HomeIcon, MapIcon, SproutIcon } from "./icons";

const tabs = [
  { href: "/", label: "Accueil", icon: HomeIcon, match: ["/"] },
  { href: "/carte", label: "Carte", icon: MapIcon, match: ["/carte", "/parcelles"] },
  { href: "/donnees", label: "Données", icon: ChartIcon, match: ["/donnees"] },
  { href: "/cultures", label: "Cultures", icon: SproutIcon, match: ["/cultures"] },
  { href: "/discuter", label: "Agent", icon: ChatIcon, match: ["/discuter", "/assistant", "/historique"] },
] as const;

function estActif(pathname: string, match: readonly string[]) {
  return match.some((m) => (m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(`${m}/`)));
}

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="grid shrink-0 grid-cols-5 border-t border-line-soft bg-surface px-1 pt-1.5 pb-[22px]"
    >
      {tabs.map(({ href, label, icon: TabIcon, match }) => {
        const on = estActif(pathname, match);
        return (
          <Link
            key={href}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-[52px] flex-col items-center justify-center gap-[3px] text-xs no-underline ${
              on ? "font-semibold text-accent" : "font-medium text-muted"
            }`}
          >
            <TabIcon />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
