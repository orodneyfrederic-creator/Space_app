import Link from "next/link";
import { ChartIcon, ChatIcon, HomeIcon, SproutIcon } from "./icons";

const tabs = [
  { href: "/", label: "Accueil", icon: HomeIcon },
  { href: "/donnees", label: "Données", icon: ChartIcon },
  { href: "/cultures", label: "Cultures", icon: SproutIcon },
  { href: "/assistant", label: "Assistant", icon: ChatIcon },
] as const;

export type Tab = (typeof tabs)[number]["href"];

export default function TabBar({ active }: { active: Tab }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="grid shrink-0 grid-cols-4 border-t border-line-soft bg-surface px-2 pt-1.5 pb-[22px]"
    >
      {tabs.map(({ href, label, icon: TabIcon }) => {
        const on = href === active;
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
