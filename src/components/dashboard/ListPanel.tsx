import { Link, useNavigate } from 'react-router-dom'
import { Panel, PanelHead } from '@/components/ui/Panel'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { relativeDue } from '@/lib/format'
import type { Application } from '@/types'

interface ListPanelProps {
  title: string
  items: Application[]
  /** Show a relative due/overdue meta column. */
  showDue?: boolean
  viewAllTo: string
  emptyLabel: string
}

export function ListPanel({ title, items, showDue, viewAllTo, emptyLabel }: ListPanelProps) {
  const navigate = useNavigate()
  const visible = (items ?? []).slice(0, 4)

  return (
    <Panel>
      <PanelHead
        title={title}
        count={items.length}
        right={
          <Link to={viewAllTo}>
            <Button size="sm" variant="ghost">
              View all
            </Button>
          </Link>
        }
      />
      {visible.length === 0 ? (
        <div className="px-4 py-8 text-center font-mono text-[11px] text-mono-c">{emptyLabel}</div>
      ) : (
        <div>
          {visible.map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => navigate(`/applications/${app.id}/edit`)}
              className="flex w-full items-center gap-3 border-b border-mono-e5 px-4 py-[11px] text-left last:border-b-0 hover:bg-mono-f5"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-medium">{app.vacancyName}</div>
                <div className="truncate text-[12px] text-mono-9">
                  {[app.organization, app.recruiterName].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
              {showDue && (
                <div className="whitespace-nowrap font-mono text-[11px] text-mono-9">
                  {relativeDue(app.nextStepDateTime)}
                </div>
              )}
              <StatusBadge status={app.status} />
            </button>
          ))}
        </div>
      )}
    </Panel>
  )
}
