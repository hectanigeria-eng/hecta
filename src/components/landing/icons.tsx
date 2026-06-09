// biome-ignore-all lint/a11y/noSvgWithoutTitle: decorative icon set; icons are aria-hidden and labelled by their parent controls
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
  ...props,
});

export const CaretDown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ArrowRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const ArrowUpRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 17 17 7" />
    <path d="M8 7h9v9" />
  </svg>
);

export const Plus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Minus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);

export const Globe = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3c2.5 2.6 3.8 5.8 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.8-3.8-9s1.3-6.4 3.8-9Z" />
  </svg>
);

export const X = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6 18 18M18 6 6 18" />
  </svg>
);

export const Check = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 12.5 10 17 19 7" />
  </svg>
);

export const ArrowDownTray = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4v11" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);

export const CreditCard = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M3 10h18" />
    <path d="M7 14.5h3" />
  </svg>
);

export const ChartLineUp = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 4v16h16" />
    <path d="m7 14 3.5-3.5 3 3L19 7" />
    <path d="M19 11V7h-4" />
  </svg>
);

export const Swap = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 4v13" />
    <path d="m3.5 13.5 3.5 3.5 3.5-3.5" />
    <path d="M17 20V7" />
    <path d="m13.5 10.5 3.5-3.5 3.5 3.5" />
  </svg>
);

export const Star = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M12 2.5 14.9 8.6l6.6.9-4.8 4.6 1.2 6.6L12 17.6 6.1 20.7l1.2-6.6L2.5 9.5l6.6-.9L12 2.5Z" />
  </svg>
);

/* Brand / social */
export const StarBadge = Star;

export const Facebook = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
  </svg>
);

export const XLogo = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M17.7 3h3.3l-7.2 8.26L22.5 21h-6.6l-5.18-6.78L4.8 21H1.5l7.7-8.84L1.8 3h6.77l4.68 6.2L17.7 3Zm-1.16 16h1.83L7.55 4.9H5.6L16.54 19Z" />
  </svg>
);

export const Youtube = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M21.6 7.2a2.78 2.78 0 0 0-1.96-1.96C17.9 4.8 12 4.8 12 4.8s-5.9 0-7.64.44A2.78 2.78 0 0 0 2.4 7.2 29 29 0 0 0 2 12a29 29 0 0 0 .4 4.8 2.78 2.78 0 0 0 1.96 1.96C6.1 19.2 12 19.2 12 19.2s5.9 0 7.64-.44a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 22 12a29 29 0 0 0-.4-4.8ZM10 15V9l5.2 3-5.2 3Z" />
  </svg>
);

export const LinkedIn = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05a3.75 3.75 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.74v20.5C0 23.2.79 24 1.77 24h20.45c.98 0 1.78-.8 1.78-1.76V1.74C24 .78 23.2 0 22.22 0Z" />
  </svg>
);

export const Instagram = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const TikTok = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M16.6 5.82a4.28 4.28 0 0 1-1.1-2.82h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.78.12v-3.2a5.85 5.85 0 0 0-.78-.06A5.7 5.7 0 1 0 15.5 15V8.9a7.34 7.34 0 0 0 4.32 1.39V7.16a4.3 4.3 0 0 1-3.22-1.34Z" />
  </svg>
);
