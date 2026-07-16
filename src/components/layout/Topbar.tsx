import { useState } from 'react'
import { CoffeeIcon, CollapseIcon, SearchIcon } from '@/components/ui/icons'
import { toggleTheme } from '@/lib/theme'
import { useAuthStore } from '@/store/authStore'
import { BUY_ME_A_COFFEE_URL } from './externalLinks'

interface TopbarProps {
  root: string
  leaf: string
  onToggleSidebar: () => void
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="7.5" y1="1" x2="7.5" y2="2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="7.5" y1="12.5" x2="7.5" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="1" y1="7.5" x2="2.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="12.5" y1="7.5" x2="14" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="3.05" y1="3.05" x2="4.11" y2="4.11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10.89" y1="10.89" x2="11.95" y2="11.95" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="11.95" y1="3.05" x2="10.89" y2="4.11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="4.11" y1="10.89" x2="3.05" y2="11.95" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M12 9.5A6 6 0 014.5 2a6 6 0 100 10 5.97 5.97 0 001.5.19A6 6 0 0112 9.5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M6 2H2.5A1.5 1.5 0 001 3.5v8A1.5 1.5 0 002.5 13H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 10.5l3-3-3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="13" y1="7.5" x2="5.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function Topbar({ root, leaf, onToggleSidebar }: TopbarProps) {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  const logout = useAuthStore((s) => s.logout)

  const handleToggleTheme = () => {
    const next = toggleTheme()
    setIsDark(next === 'dark')
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3.5 border-b border-mono-e5 bg-mono-w px-4 md:px-5">
      {/* sidebar toggle — desktop only */}
      <button
        type="button"
        onClick={onToggleSidebar}
        title="Toggle sidebar"
        aria-label="Toggle sidebar"
        className="hidden md:grid h-[30px] w-[30px] place-items-center rounded border border-mono-e5 bg-mono-w text-mono-5 hover:bg-mono-f5 hover:text-mono-1"
      >
        <CollapseIcon />
      </button>

      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-mono-9">
        <span className="hidden sm:inline">{root}</span>
        <span className="hidden sm:inline">/</span>
        <b className="font-semibold text-mono-1">{leaf}</b>
      </nav>

      <div className="ml-auto flex items-center gap-2">
        {/* search — hidden on mobile */}
        <label className="hidden md:flex w-[210px] items-center gap-2 rounded border border-mono-e5 px-2.5 py-1.5 text-[13px] text-mono-9">
          <SearchIcon />
          <input
            type="search"
            placeholder="Search…"
            className="w-full border-0 bg-transparent text-[13px] text-mono-1 outline-none placeholder:text-mono-9"
          />
          <span className="rounded border border-mono-e5 border-b-2 bg-surface-subtle px-1.5 py-px font-mono text-[11px] text-mono-5">
            ⌘K
          </span>
        </label>

        {/* support — desktop only */}
        <a
          href={BUY_ME_A_COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Buy me a coffee"
          aria-label="Buy me a coffee"
          className="hidden h-[30px] w-[30px] place-items-center rounded border border-mono-e5 bg-mono-w text-mono-5 transition-colors hover:bg-mono-f5 hover:text-mono-1 md:grid"
        >
          <CoffeeIcon />
        </a>

        {/* dark / light mode toggle */}
        <button
          type="button"
          onClick={handleToggleTheme}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="grid h-[30px] w-[30px] place-items-center rounded border border-mono-e5 bg-mono-w text-mono-5 transition-colors hover:bg-mono-f5 hover:text-mono-1"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* sign out */}
        <button
          type="button"
          onClick={logout}
          title="Sign out"
          aria-label="Sign out"
          className="grid h-[30px] w-[30px] place-items-center rounded border border-mono-e5 bg-mono-w text-mono-5 transition-colors hover:bg-mono-f5 hover:text-mono-1"
        >
          <SignOutIcon />
        </button>
      </div>
    </header>
  )
}
