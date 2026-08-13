import type { ComponentType } from 'react'
import {
  ApplicationsIcon,
  DashboardIcon,
  DownloadIcon,
  MetricsIcon,
  SettingsIcon,
} from '@/components/ui/icons'

export interface NavItem {
  label: string
  to: string
  section: 'Workspace' | 'System'
  icon?: ComponentType<{ size?: number }>
  /** Renders a glyph instead of an svg (e.g. the `</>` developer icon). */
  glyph?: string
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', section: 'Workspace', icon: DashboardIcon },
  { label: 'Applications', to: '/applications', section: 'Workspace', icon: ApplicationsIcon },
  { label: 'Metrics', to: '/metrics', section: 'Workspace', icon: MetricsIcon },
  { label: 'Exports', to: '/exports', section: 'Workspace', icon: DownloadIcon },
  { label: 'Developer Tools', to: '/developer', section: 'System', glyph: '</>' },
  { label: 'Account Settings', to: '/account', section: 'System', icon: SettingsIcon },
]

export function breadcrumbFor(pathname: string): { root: string; leaf: string } {
  const match = NAV_ITEMS.find((item) => pathname.startsWith(item.to))
  if (match) return { root: match.section, leaf: match.label }
  if (pathname.startsWith('/applications/new')) return { root: 'Workspace', leaf: 'New Application' }
  return { root: 'Workspace', leaf: 'Dashboard' }
}
