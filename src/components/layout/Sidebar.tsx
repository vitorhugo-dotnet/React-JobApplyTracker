import { NavLink } from 'react-router-dom'
import { cn, initials } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { NAV_ITEMS, type NavItem } from './navigation'

interface SidebarProps {
  collapsed: boolean
  activeCount?: number
}

export function Sidebar({ collapsed, activeCount }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const profile = useGamificationStore((s) => s.profile)

  const sections = ['Workspace', 'System'] as const

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-mono-e5 bg-mono-w transition-[width] duration-150',
        collapsed ? 'w-16' : 'w-[244px]',
      )}
    >
      {/* brand */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center gap-2.5 border-b border-mono-e5',
          collapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        <div className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-[5px] bg-mono-0 text-sm font-bold text-mono-w">
          A
        </div>
        {!collapsed && (
          <div className="whitespace-nowrap text-[14.5px] font-semibold tracking-[-0.01em]">
            Applywell
          </div>
        )}
      </div>

      {/* nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 py-3">
        {sections.map((section) => (
          <div key={section} className="contents">
            {!collapsed && (
              <div className="whitespace-nowrap px-2.5 pb-1.5 pt-3 font-mono text-[10px] uppercase tracking-widest text-mono-9">
                {section}
              </div>
            )}
            {NAV_ITEMS.filter((item) => item.section === section).map((item) => (
              <NavRow
                key={item.to}
                item={item}
                collapsed={collapsed}
                badge={item.to === '/applications' ? activeCount : undefined}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* XP / level indicator */}
      <div
        className={cn(
          'shrink-0 border-t border-mono-e5 p-3',
          collapsed && 'flex justify-center',
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full bg-mono-1 text-xs font-semibold text-mono-w">
            {initials(user?.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold leading-tight">
                Level {profile?.level ?? 1}
              </div>
              <div className="truncate font-mono text-[10.5px] text-mono-9">
                {profile?.rankTitle ?? 'Newcomer'}
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-mono-e5">
              <div
                className="h-full rounded-full bg-mono-0"
                style={{ width: `${profile?.progressPercentage ?? 0}%` }}
              />
            </div>
            <div className="mt-1.5 font-mono text-[10px] text-mono-9">
              {(profile?.currentXp ?? 0).toLocaleString()} / {(profile?.nextLevelXp ?? 0).toLocaleString()} XP
              {profile ? ` · ${profile.xpToNextLevel} to L${profile.level + 1}` : ''}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

function NavRow({
  item,
  collapsed,
  badge,
}: {
  item: NavItem
  collapsed: boolean
  badge?: number
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      title={item.label}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-[11px] rounded border border-transparent px-2.5 py-[7px] text-[13.5px] transition-colors',
          collapsed && 'justify-center px-0 py-2',
          isActive
            ? 'bg-mono-0 text-mono-w'
            : 'text-mono-2 hover:bg-mono-f5',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'grid h-4 w-4 shrink-0 place-items-center',
              isActive ? 'text-mono-w' : 'text-mono-5',
            )}
          >
            {Icon ? <Icon size={15} /> : <span className="font-mono text-xs font-semibold">{item.glyph}</span>}
          </span>
          {!collapsed && <span className="flex-1 whitespace-nowrap">{item.label}</span>}
          {!collapsed && badge != null && (
            <span
              className={cn(
                'ml-auto rounded-full px-[7px] py-px font-mono text-[11px]',
                isActive ? 'bg-mono-w/16 text-mono-w' : 'bg-mono-f5 text-mono-9',
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}
