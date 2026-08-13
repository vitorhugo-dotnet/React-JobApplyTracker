import { cn } from '@/lib/utils'
import { formatDate, formatDateTime } from '@/lib/format'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Spinner } from '@/components/ui/feedback'
import {
  ArchiveIcon,
  EditIcon,
  NoteIcon,
  RestoreIcon,
  SortIcon,
  TrashIcon,
} from '@/components/ui/icons'
import type { Application } from '@/types'

export interface SortState {
  key: string
  dir: 'asc' | 'desc'
}

interface Column {
  key: string
  label: string
  sortable?: boolean
}

const COLUMNS: Column[] = [
  { key: 'vacancyName', label: 'Vacancy', sortable: true },
  { key: 'recruiterName', label: 'Recruiter', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'applicationDate', label: 'Applied', sortable: true },
  { key: 'nextStepDateTime', label: 'Next Step', sortable: true },
  { key: 'note', label: 'Note' },
  { key: 'actions', label: '' },
]

interface ApplicationsTableProps {
  items: Application[]
  sort: SortState
  onSort: (key: string) => void
  onEdit: (app: Application) => void
  onArchive: (app: Application) => void
  onRestore: (app: Application) => void
  onDelete: (app: Application) => void
  archived?: boolean
  /** Application whose row action is in flight — its control is disabled. */
  busyId?: string | null
}

export function ApplicationsTable({
  items,
  sort,
  onSort,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  archived,
  busyId,
}: ApplicationsTableProps) {
  return (
    <div className="overflow-x-auto rounded border border-mono-e5">
      <table className="w-full border-collapse text-[13.5px]">
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const sorted = col.key === sort.key
              return (
                <th
                  key={col.key}
                  onClick={col.sortable ? () => onSort(col.key) : undefined}
                  className={cn(
                    'whitespace-nowrap border-b border-mono-e5 bg-surface-subtle px-3.5 py-2.5 text-left font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-mono-9 select-none',
                    col.sortable && 'cursor-pointer hover:text-mono-2',
                    sorted && 'text-mono-1',
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <SortIcon className={sorted ? 'text-mono-1' : 'text-mono-c'} />
                    )}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {items.map((app) => (
            <tr key={app.id} className="group border-b border-mono-e5 last:border-b-0 hover:bg-mono-f5">
              <td className="px-3.5 py-[11px] align-middle">
                <div className="font-medium text-mono-1">{app.vacancyName}</div>
                <div className="text-xs text-mono-9">{app.organization || '—'}</div>
              </td>
              <td className="px-3.5 py-[11px] align-middle">{app.recruiterName || '—'}</td>
              <td className="px-3.5 py-[11px] align-middle">
                <StatusBadge status={app.status} />
              </td>
              <td className="px-3.5 py-[11px] align-middle font-mono text-[12.5px] text-mono-2">
                {formatDate(app.applicationDate)}
              </td>
              <td className="px-3.5 py-[11px] align-middle text-mono-9">
                {formatDateTime(app.nextStepDateTime)}
              </td>
              <td className="px-3.5 py-[11px] align-middle">
                {app.note ? (
                  <span className="inline-grid h-[22px] w-[22px] place-items-center text-mono-5" title={app.note}>
                    <NoteIcon />
                  </span>
                ) : (
                  <span className="inline-block w-[22px] text-center text-mono-c">–</span>
                )}
              </td>
              <td className="px-3.5 py-[11px] align-middle">
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <RowAction title="Edit" onClick={() => onEdit(app)}>
                    <EditIcon />
                  </RowAction>
                  {archived ? (
                    <RowAction
                      title="Restore"
                      onClick={() => onRestore(app)}
                      busy={busyId === app.id}
                    >
                      <RestoreIcon />
                    </RowAction>
                  ) : (
                    <RowAction title="Archive" onClick={() => onArchive(app)}>
                      <ArchiveIcon />
                    </RowAction>
                  )}
                  <RowAction title="Delete" onClick={() => onDelete(app)}>
                    <TrashIcon />
                  </RowAction>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RowAction({
  title,
  onClick,
  busy,
  children,
}: {
  title: string
  onClick: () => void
  busy?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-busy={busy || undefined}
      disabled={busy}
      onClick={onClick}
      className={cn(
        'grid h-[26px] w-[26px] place-items-center rounded border border-transparent text-mono-9 hover:border-mono-e5 hover:bg-mono-w hover:text-mono-1',
        busy && 'cursor-not-allowed opacity-60',
      )}
    >
      {busy ? <Spinner className="h-3.5 w-3.5 border" /> : children}
    </button>
  )
}
