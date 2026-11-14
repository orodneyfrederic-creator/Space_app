import type { ReactNode } from "react";

function Icon({ size = 22, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

export const HomeIcon = () => (
  <Icon><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></Icon>
);
export const ChartIcon = () => (
  <Icon><path d="M4 20V11M10 20V5M16 20v-6M21 20H3" /></Icon>
);
export const SproutIcon = () => (
  <Icon><path d="M12 21v-9M12 12C12 7 8.5 4 3.5 4c0 5 3.5 8 8.5 8zM12 12c0-4 3-7 8-7 0 4-3 7-8 7z" /></Icon>
);
export const ChatIcon = () => (
  <Icon><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" /></Icon>
);
export const PinIcon = () => (
  <Icon size={20}>
    <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
    <circle cx="12" cy="9" r="2.5" />
  </Icon>
);
export const SunIcon = () => (
  <Icon>
    <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M7 7 5.5 5.5M18.5 18.5 17 17M17 7l1.5-1.5M5.5 18.5 7 17" />
    <circle cx="12" cy="12" r="4" />
  </Icon>
);
export const ArrowIcon = () => (
  <Icon size={20}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>
);
