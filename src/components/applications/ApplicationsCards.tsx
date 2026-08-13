import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/feedback'
import { CalendarIcon, ClockIcon, NoteIcon, RestoreIcon } from '@/components/ui/icons'
import { formatDate, formatDateTime } from '@/lib/format'
import type { Application } from '@/types'

interface ApplicationsCardsProps {
  items: Application[]
  /** Rendering the archived tab — swaps the card footer for a Restore action. */
  archived?: boolean
  onRestore?: (app: Application) => void
  /** Application whose action is in flight — its control is disabled. */
  busyId?: string | null
}

/** Card-per-application layout used on mobile / narrow viewports. */
export function ApplicationsCards({ items, archived, onRestore, busyId }: ApplicationsCardsProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-2.5">
      {items.map((app) => {
        const busy = busyId === app.id
        return (
          <div key={app.id} className="rounded border border-mono-e5">
            <button
              type="button"
              onClick={() => navigate(`/applications/${app.id}/edit`)}
              className="w-full rounded p-3 text-left hover:bg-mono-f5"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-tight">{app.vacancyName}</div>
                  <div className="mt-0.5 text-xs text-mono-9">
                    {[app.organization, app.recruiterName].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-3.5 border-t border-mono-e5 pt-2.5 font-mono text-[11px] text-mono-9">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon /> {formatDate(app.applicationDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon /> {formatDateTime(app.nextStepDateTime)}
                </span>
                {app.note && (
                  <span className="inline-flex items-center gap-1.5">
                    <NoteIcon />
                  </span>
                )}
              </div>
            </button>
            {archived && onRestore && (
              <div className="flex justify-end border-t border-mono-e5 px-3 py-2">
                <Button
                  size="sm"
                  aria-label="Restore"
                  aria-busy={busy || undefined}
                  disabled={busy}
                  onClick={() => onRestore(app)}
                >
                  {busy ? <Spinner className="h-3.5 w-3.5 border" /> : <RestoreIcon />} Restore
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
