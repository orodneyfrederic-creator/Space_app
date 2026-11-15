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
export const MapIcon = () => (
  <Icon><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14" /></Icon>
);
export const MicIcon = () => (
  <Icon size={20}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </Icon>
);
export const ClockIcon = () => (
  <Icon size={20}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);
export const PaperclipIcon = () => (
  <Icon size={20}><path d="m21 11-8.6 8.6a5 5 0 0 1-7-7L14 4a3.3 3.3 0 0 1 4.7 4.7l-8.6 8.6a1.7 1.7 0 0 1-2.4-2.4L15.5 7" /></Icon>
);
export const ToolIcon = () => (
  <Icon size={16}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" /></Icon>
);
export const DocIcon = () => (
  <Icon size={20}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5M9 13h6M9 17h4" />
  </Icon>
);
export const DropIcon = () => (
  <Icon><path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z" /></Icon>
);
