import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { NoteIcon } from '@/components/ui/icons'
import { formatDate } from '@/lib/format'
import { familyOf, statusLabel, STATUS_FAMILY_BADGE, STATUS_FAMILY_DOT, STATUS_OPTIONS } from '@/lib/statuses'
import type { Application } from '@/types'

export function ApplicationsBoard({ items }: { items: Application[] }) {
  return (
    <div className="grid auto-cols-[minmax(190px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
      {STATUS_OPTIONS.map(({ value: status, label }) => {
        const cards = items.filter((a) => a.status === status)
        const family = familyOf(status)
        return (
          <div key={status} className="flex min-h-[200px] flex-col rounded border border-mono-e5 bg-surface-subtle">
            <div className="flex items-center gap-2 border-b border-mono-e5 px-3 py-[11px]">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-0.5 text-xs leading-none',
                  STATUS_FAMILY_BADGE[family],
                )}
              >
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', STATUS_FAMILY_DOT[family])} />
                <span className="max-w-[130px] truncate" title={statusLabel(status)}>{label}</span>
              </span>
              <span className="ml-auto font-mono text-[11px] text-mono-9">{cards.length}</span>
            </div>
            <div className="flex flex-col gap-2 p-2.5">
              {cards.length === 0 ? (
                <div className="p-2 text-center font-mono text-[11px] text-mono-c">empty</div>
              ) : (
                cards.map((app) => (
                  <Link
                    key={app.id}
                    to={`/applications/${app.id}/edit`}
                    className="rounded border border-mono-e5 bg-mono-w p-[11px] text-left hover:border-mono-c"
                  >
                    <div className="text-[13px] font-semibold leading-tight">{app.vacancyName}</div>
                    <div className="mt-0.5 text-[11.5px] text-mono-9">
                      {[app.organization, app.recruiterName].filter(Boolean).join(' · ') || '—'}
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      {app.note && (
                        <span className="text-mono-5">
                          <NoteIcon />
                        </span>
                      )}
                      <span className="ml-auto font-mono text-[10.5px] text-mono-9">
                        {formatDate(app.applicationDate)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
