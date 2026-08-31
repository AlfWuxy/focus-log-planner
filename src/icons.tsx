import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const defaults = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export const DatabaseIcon = ({ size = 22, ...props }: IconProps) => (
  <svg {...defaults(size)} {...props}>
    <ellipse cx="12" cy="5" rx="7.5" ry="3" />
    <path d="M4.5 5v5c0 1.7 3.35 3 7.5 3s7.5-1.3 7.5-3V5" />
    <path d="M4.5 10v5c0 1.7 3.35 3 7.5 3s7.5-1.3 7.5-3v-5" />
  </svg>
);

export const PencilIcon = ({ size = 21, ...props }: IconProps) => (
  <svg {...defaults(size)} {...props}>
    <path d="m4 20 4.25-1 10.4-10.4a2.15 2.15 0 0 0-3.05-3.05L5.2 15.95 4 20Z" />
    <path d="m14.4 6.75 3.05 3.05" />
  </svg>
);

export const CalendarIcon = ({ size = 23, ...props }: IconProps) => (
  <svg {...defaults(size)} {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M7 3v4M17 3v4M3 10h18" />
  </svg>
);

export const GearIcon = ({ size = 24, ...props }: IconProps) => (
  <svg {...defaults(size)} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V21h-4v-.08A1.7 1.7 0 0 0 8.96 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15.04 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.6 8.96a1.7 1.7 0 0 0-.34-1.87l-.06-.06L7.03 4.2l.06.06a1.7 1.7 0 0 0 1.87.34A1.7 1.7 0 0 0 10 3.08V3h4v.08a1.7 1.7 0 0 0 1.04 1.52 1.7 1.7 0 0 0 1.87-.34l.06-.06 2.83 2.83-.06.06a1.7 1.7 0 0 0-.34 1.87A1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" />
  </svg>
);

export const CheckIcon = ({ size = 20, ...props }: IconProps) => (
  <svg {...defaults(size)} strokeWidth="2.2" {...props}>
    <path d="m5 12 4.2 4.2L19 6.8" />
  </svg>
);

export const ChevronDownIcon = ({ size = 18, ...props }: IconProps) => (
  <svg {...defaults(size)} {...props}>
    <path d="m7 10 5 5 5-5" />
  </svg>
);

export const MenuIcon = ({ size = 30, ...props }: IconProps) => (
  <svg {...defaults(size)} strokeWidth="2" {...props}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = ({ size = 24, ...props }: IconProps) => (
  <svg {...defaults(size)} {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const MinusIcon = ({ size = 22, ...props }: IconProps) => (
  <svg {...defaults(size)} {...props}>
    <path d="M5 12h14" />
  </svg>
);

export const PlusIcon = ({ size = 22, ...props }: IconProps) => (
  <svg {...defaults(size)} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const DragIcon = ({ size = 20, ...props }: IconProps) => (
  <svg {...defaults(size)} fill="currentColor" stroke="none" {...props}>
    <circle cx="9" cy="6" r="1.25" />
    <circle cx="15" cy="6" r="1.25" />
    <circle cx="9" cy="12" r="1.25" />
    <circle cx="15" cy="12" r="1.25" />
    <circle cx="9" cy="18" r="1.25" />
    <circle cx="15" cy="18" r="1.25" />
  </svg>
);

export const NotionIcon = ({ size = 22, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M7 17V7.2l2.2-.5 6.2 8.6V7" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    <path d="M14 7h3M6 7h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);
