import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { CoffeeIcon } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { BUY_ME_A_COFFEE_URL } from './externalLinks'
import { NAV_ITEMS } from './navigation'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-mono-0/20 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-5 right-5 z-50 flex flex-col-reverse items-end gap-2.5">
        {open && (
          <div className="flex flex-col-reverse gap-2">
            <a
              href={BUY_ME_A_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-full border border-mono-e5 bg-mono-w px-3.5 py-2 text-[13px] text-mono-1 shadow-lg transition-colors hover:bg-mono-f5"
            >
              <span className="grid h-4 w-4 shrink-0 place-items-center">
                <CoffeeIcon size={14} />
              </span>
              Buy me a coffee
            </a>

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-full border border-mono-e5 bg-mono-w px-3.5 py-2 text-[13px] shadow-lg transition-colors',
                      isActive
                        ? 'border-mono-0 bg-mono-0 font-medium text-mono-w'
                        : 'text-mono-1 hover:bg-mono-f5',
                    )
                  }
                >
                  <span className="grid h-4 w-4 shrink-0 place-items-center">
                    {Icon
                      ? <Icon size={14} />
                      : <span className="font-mono text-[10px] font-semibold">{item.glyph}</span>}
                  </span>
                  {item.label}
                </NavLink>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          className="grid h-12 w-12 place-items-center rounded-full border border-mono-e5 bg-mono-0 text-mono-w shadow-xl transition-all hover:opacity-90 active:scale-95"
        >
          {open ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 1.5L12.5 12.5M12.5 1.5L1.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
              <rect width="16" height="2" rx="1" />
              <rect y="5" width="16" height="2" rx="1" />
              <rect y="10" width="16" height="2" rx="1" />
            </svg>
          )}
        </button>
      </div>
    </>
  )
}
