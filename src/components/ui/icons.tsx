import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base({ size = 15, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 15 15',
    fill: 'none',
    ...props,
  }
}

export const SearchIcon = (p: IconProps) => (
  <svg {...base({ size: 14, ...p })}>
    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" />
    <line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" strokeLinecap="round" />
  </svg>
)

export const FilterIcon = (p: IconProps) => (
  <svg {...base({ size: 14, ...p })}>
    <line x1="1.5" y1="4" x2="13.5" y2="4" stroke="currentColor" strokeLinecap="round" />
    <line x1="3.5" y1="7.5" x2="11.5" y2="7.5" stroke="currentColor" strokeLinecap="round" />
    <line x1="5.5" y1="11" x2="9.5" y2="11" stroke="currentColor" strokeLinecap="round" />
  </svg>
)

export const PlusIcon = (p: IconProps) => (
  <svg {...base({ size: 14, ...p })}>
    <line x1="7.5" y1="2" x2="7.5" y2="13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="2" y1="7.5" x2="13" y2="7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

export const EditIcon = (p: IconProps) => (
  <svg {...base({ size: 14, ...p })}>
    <path d="M10 2.5L12.5 5L5 12.5L2.2 13L2.7 10.2L10 2.5Z" stroke="currentColor" strokeLinejoin="round" />
  </svg>
)

export const ArchiveIcon = (p: IconProps) => (
  <svg {...base({ size: 14, ...p })}>
    <rect x="1.5" y="2" width="12" height="3" rx="0.5" stroke="currentColor" />
    <path d="M2.5 5.5V12.5H12.5V5.5" stroke="currentColor" />
    <line x1="6" y1="8" x2="9" y2="8" stroke="currentColor" strokeLinecap="round" />
  </svg>
)

export const TrashIcon = (p: IconProps) => (
  <svg {...base({ size: 14, ...p })}>
    <path d="M2.5 4H12.5M5 4V2.5H10V4M3.5 4V12.5H11.5V4" stroke="currentColor" strokeLinejoin="round" />
  </svg>
)

export const NoteIcon = (p: IconProps) => (
  <svg {...base({ size: 13, ...p })}>
    <rect x="2" y="1.5" width="11" height="12" rx="1" stroke="currentColor" />
    <line x1="4.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeLinecap="round" />
    <line x1="4.5" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" strokeLinecap="round" />
    <line x1="4.5" y1="10" x2="8" y2="10" stroke="currentColor" strokeLinecap="round" />
  </svg>
)

export const CalendarIcon = (p: IconProps) => (
  <svg {...base({ size: 13, ...p })}>
    <rect x="1.5" y="2.5" width="12" height="11" rx="1" stroke="currentColor" />
    <line x1="1.5" y1="5.5" x2="13.5" y2="5.5" stroke="currentColor" />
    <line x1="4.5" y1="1" x2="4.5" y2="3.5" stroke="currentColor" strokeLinecap="round" />
    <line x1="10.5" y1="1" x2="10.5" y2="3.5" stroke="currentColor" strokeLinecap="round" />
  </svg>
)

export const ClockIcon = (p: IconProps) => (
  <svg {...base({ size: 13, ...p })}>
    <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" />
    <path d="M7.5 4V7.5L10 9" stroke="currentColor" strokeLinecap="round" />
  </svg>
)

export const LinkIcon = (p: IconProps) => (
  <svg {...base({ size: 13, ...p })}>
    <path
      d="M6 9L9 6M5.5 11L4 12.5C3 13.5 1.5 13.5 0.8 12.5C0 11.7 0 10.3 1 9.3L2.5 7.8M9.5 4L11 2.5C12 1.5 13.5 1.5 14.2 2.5C15 3.3 15 4.7 14 5.7L12.5 7.2"
      stroke="currentColor"
      strokeLinecap="round"
      transform="scale(0.95) translate(0.3 0.3)"
    />
  </svg>
)

export const CheckIcon = (p: IconProps) => (
  <svg {...base({ size: 12, ...p })}>
    <path d="M2.5 7.5L6 11L12.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const SortIcon = (p: IconProps) => (
  <svg {...base({ size: 11, ...p })}>
    <path d="M5 6L7.5 3L10 6M5 9L7.5 12L10 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CollapseIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="0.5" y="1.5" width="12" height="12" rx="1.5" stroke="currentColor" />
    <line x1="5" y1="1.5" x2="5" y2="13.5" stroke="currentColor" />
  </svg>
)

export const CoffeeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2 4.5H11V8.5A4 4 0 017 12.5H6A4 4 0 012 8.5V4.5Z" stroke="currentColor" strokeLinejoin="round" />
    <path d="M11 6H12A2 2 0 0112 10H10.5" stroke="currentColor" strokeLinecap="round" />
    <path d="M4.5 1.5V3M7 1.5V3M9.5 1.5V3" stroke="currentColor" strokeLinecap="round" />
  </svg>
)

/* ---- sidebar nav icons ---- */
export const DashboardIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="0.5" y="0.5" width="6" height="6" rx="1" stroke="currentColor" />
    <rect x="8.5" y="0.5" width="6" height="6" rx="1" stroke="currentColor" />
    <rect x="0.5" y="8.5" width="6" height="6" rx="1" stroke="currentColor" />
    <rect x="8.5" y="8.5" width="6" height="6" rx="1" stroke="currentColor" />
  </svg>
)

export const ApplicationsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="0.5" y="1" width="3" height="3" rx="0.5" stroke="currentColor" />
    <rect x="0.5" y="6" width="3" height="3" rx="0.5" stroke="currentColor" />
    <rect x="0.5" y="11" width="3" height="3" rx="0.5" stroke="currentColor" />
    <line x1="6" y1="2.5" x2="14.5" y2="2.5" stroke="currentColor" />
    <line x1="6" y1="7.5" x2="14.5" y2="7.5" stroke="currentColor" />
    <line x1="6" y1="12.5" x2="14.5" y2="12.5" stroke="currentColor" />
  </svg>
)

export const MetricsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="0.5" y="9" width="3.5" height="5.5" rx="0.5" stroke="currentColor" />
    <rect x="5.75" y="5" width="3.5" height="9.5" rx="0.5" stroke="currentColor" />
    <rect x="11" y="1.5" width="3.5" height="13" rx="0.5" stroke="currentColor" />
  </svg>
)

export const DownloadIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <line x1="7.5" y1="1.5" x2="7.5" y2="9.5" stroke="currentColor" strokeLinecap="round" />
    <path d="M4.5 6.5L7.5 9.5L10.5 6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 11V13H13V11" stroke="currentColor" strokeLinecap="round" />
  </svg>
)

export const SettingsIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" />
    <path d="M2 13.5C2.5 10.7 4.7 9 7.5 9C10.3 9 12.5 10.7 13 13.5" stroke="currentColor" strokeLinecap="round" />
  </svg>
)

/* ---- achievement shapes (geometric only) ---- */
export type ShapeName = 'square' | 'circle' | 'diamond' | 'triangle' | 'ring' | 'bolt'

export function Shape({ name, size = 16 }: { name: ShapeName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 16 16' }
  switch (name) {
    case 'circle':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.5" fill="currentColor" />
        </svg>
      )
    case 'diamond':
      return (
        <svg {...common}>
          <rect x="8" y="0.5" width="10.6" height="10.6" rx="1.5" transform="rotate(45 8 0.5)" fill="currentColor" />
        </svg>
      )
    case 'triangle':
      return (
        <svg {...common}>
          <path d="M8 2.5L14 13H2L8 2.5Z" fill="currentColor" />
        </svg>
      )
    case 'ring':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="2.4" fill="none" />
        </svg>
      )
    case 'bolt':
      return (
        <svg {...common}>
          <path d="M9 1.5L3.5 9H7.5L6.5 14.5L12.5 6.5H8.5L9 1.5Z" fill="currentColor" />
        </svg>
      )
    case 'square':
    default:
      return (
        <svg {...common}>
          <rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor" />
        </svg>
      )
  }
}
