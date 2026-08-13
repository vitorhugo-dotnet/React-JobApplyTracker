import { useCallback, useMemo, useState } from 'react'
import { Page, PageHeader, SectionLabel } from '@/components/ui/PageHeader'
import { Panel, PanelHead } from '@/components/ui/Panel'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/Segmented'
import { Switch } from '@/components/ui/Toggle'
import { Dialog, ConfirmDialog } from '@/components/ui/Dialog'
import { CenteredSpinner, ErrorNote, Spinner } from '@/components/ui/feedback'
import { useAsync } from '@/hooks/useAsync'
import { getStatuses } from '@/api/applications'
import {
  createExportSchedule,
  deleteExportSchedule,
  downloadApplicationsExport,
  getExportColumns,
  getExportHistory,
  getExportSchedules,
  runExportScheduleNow,
  setExportScheduleEnabled,
  updateExportSchedule,
} from '@/api/exports'
import { saveBlob } from '@/lib/download'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  EXPORT_FORMATS,
  TO_SEND_LATER_STATUS,
  type ExportColumnOption,
  type ExportExecution,
  type ExportExecutionPage,
  type ExportFilters,
  type ExportFormat,
  type ExportFrequency,
  type ExportSchedule,
  type ExportScheduleRequest,
} from '@/types'

const FORMAT_OPTIONS = EXPORT_FORMATS.map((format) => ({ value: format, label: format }))

const ARCHIVE_OPTIONS = [
  { value: 'all', label: 'Active and archived' },
  { value: 'active', label: 'Active only' },
  { value: 'archived', label: 'Archived only' },
] as const
type ArchiveScope = (typeof ARCHIVE_OPTIONS)[number]['value']

const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]

/** The browser's timezone is the sensible default for a new schedule. */
function browserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

function archivedFromScope(scope: ArchiveScope): boolean | null {
  if (scope === 'active') return false
  if (scope === 'archived') return true
  return null
}

function scopeFromArchived(archived?: boolean | null): ArchiveScope {
  if (archived === false) return 'active'
  if (archived === true) return 'archived'
  return 'all'
}

export function describeSchedule(schedule: ExportSchedule): string {
  const when =
    schedule.frequency === 'DAILY'
      ? 'Daily'
      : schedule.frequency === 'WEEKLY'
        ? `Weekly on ${WEEKDAYS.find((d) => d.value === schedule.dayOfWeek)?.label ?? 'Monday'}`
        : `Monthly on day ${schedule.dayOfMonth ?? 1}`
  return `${when} at ${schedule.time} · ${schedule.timezone}`
}

function StatusChips({
  statuses,
  selected,
  onToggle,
}: {
  statuses: string[]
  selected: string[]
  onToggle: (status: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {statuses.map((status) => {
        const active = selected.includes(status)
        return (
          <button
            key={status}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(status)}
            className={cn(
              'rounded border px-2.5 py-1 text-[12px] transition-colors',
              active
                ? 'border-mono-0 bg-mono-0 text-mono-w'
                : 'border-mono-e5 bg-mono-w text-mono-5 hover:bg-mono-f5',
            )}
          >
            {status === TO_SEND_LATER_STATUS ? 'To send later' : status}
          </button>
        )
      })}
    </div>
  )
}

function ManualExportPanel({
  statuses,
  onExported,
}: {
  statuses: string[]
  onExported: () => void
}) {
  const { data: columns } = useAsync<ExportColumnOption[]>(
    () => getExportColumns().catch(() => []),
    [],
  )

  const [format, setFormat] = useState<ExportFormat>('CSV')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [organization, setOrganization] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [archiveScope, setArchiveScope] = useState<ArchiveScope>('all')
  const [selectedColumns, setSelectedColumns] = useState<string[] | null>(null)
  const [showColumns, setShowColumns] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ fileName: string; recordCount: number; truncated: boolean } | null>(null)

  const toggleStatus = (status: string) =>
    setSelectedStatuses((current) =>
      current.includes(status) ? current.filter((s) => s !== status) : [...current, status],
    )

  const toggleColumn = (key: string) =>
    setSelectedColumns((current) => {
      const base = current ?? (columns ?? []).map((column) => column.key)
      return base.includes(key) ? base.filter((c) => c !== key) : [...base, key]
    })

  const filters: ExportFilters = useMemo(
    () => ({
      status: selectedStatuses,
      organization: organization.trim() || null,
      applicationDateFrom: dateFrom || null,
      applicationDateTo: dateTo || null,
      archived: archivedFromScope(archiveScope),
    }),
    [selectedStatuses, organization, dateFrom, dateTo, archiveScope],
  )

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    setResult(null)
    try {
      const download = await downloadApplicationsExport({
        format,
        filters,
        columns: selectedColumns ?? [],
      })
      saveBlob(download.blob, download.fileName)
      setResult({
        fileName: download.fileName,
        recordCount: download.recordCount,
        truncated: download.truncated,
      })
      // The download is recorded server-side, so the history below is now stale.
      onExported()
    } catch {
      setError('Could not generate the export. Check your filters and try again.')
    } finally {
      setDownloading(false)
    }
  }

  const activeColumns = selectedColumns ?? (columns ?? []).map((column) => column.key)
  const noColumnsSelected = activeColumns.length === 0

  return (
    <Panel>
      <PanelHead
        title="Manual export"
        right={
          <Segmented
            options={FORMAT_OPTIONS}
            value={format}
            onChange={(value) => setFormat(value as ExportFormat)}
            aria-label="Export format"
          />
        }
      />
      <div className="p-4">
        {error && (
          <div className="mb-4">
            <ErrorNote message={error} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Status" full hint="No status selected exports every status.">
            <StatusChips
              statuses={[TO_SEND_LATER_STATUS, ...statuses]}
              selected={selectedStatuses}
              onToggle={toggleStatus}
            />
          </Field>

          <Field label="Organization" htmlFor="export-organization">
            <Input
              id="export-organization"
              placeholder="Partial match…"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </Field>

          <Field label="Archive" htmlFor="export-archive">
            <Select
              id="export-archive"
              value={archiveScope}
              onChange={(e) => setArchiveScope(e.target.value as ArchiveScope)}
            >
              {ARCHIVE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Application date from" htmlFor="export-date-from">
            <Input
              id="export-date-from"
              className="mono"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </Field>

          <Field label="Application date to" htmlFor="export-date-to">
            <Input
              id="export-date-to"
              className="mono"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </Field>
        </div>

        {columns && columns.length > 0 && (
          <div className="mt-4 border-t border-mono-e5 pt-4">
            <button
              type="button"
              className="text-[12.5px] font-medium text-mono-5 hover:text-mono-1"
              onClick={() => setShowColumns((open) => !open)}
              aria-expanded={showColumns}
            >
              {showColumns ? '− Columns' : '+ Columns'}{' '}
              <span className="font-mono text-[11px] text-mono-9">
                ({activeColumns.length}/{columns.length})
              </span>
            </button>
            {showColumns && (
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {columns.map((column) => (
                  <label
                    key={column.key}
                    className="flex cursor-pointer items-center gap-2 text-[12.5px] text-mono-5"
                  >
                    <input
                      type="checkbox"
                      checked={activeColumns.includes(column.key)}
                      onChange={() => toggleColumn(column.key)}
                    />
                    {column.header}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-[18px] flex flex-wrap items-center justify-end gap-3">
          {noColumnsSelected && (
            <span className="font-mono text-[11px] text-mono-9">Select at least one column.</span>
          )}
          {result && (
            <span className="font-mono text-[11px] text-mono-9">
              {result.recordCount} row{result.recordCount === 1 ? '' : 's'} → {result.fileName}
              {result.truncated ? ' · truncated by the record limit' : ''}
            </span>
          )}
          <Button variant="primary" onClick={handleDownload} disabled={downloading || noColumnsSelected}>
            {downloading ? <Spinner className="border-white/40 border-t-white" /> : `Download ${format}`}
          </Button>
        </div>
      </div>
    </Panel>
  )
}

const EMPTY_SCHEDULE_FORM: ExportScheduleRequest = {
  name: '',
  format: 'XLSX',
  frequency: 'DAILY',
  time: '20:00',
  dayOfWeek: 1,
  dayOfMonth: 1,
  timezone: browserTimezone(),
  enabled: true,
  filters: { archived: null },
  columns: [],
  destination: 'GOOGLE_DRIVE',
}

function ScheduleDialog({
  open,
  initial,
  saving,
  error,
  onSave,
  onClose,
}: {
  open: boolean
  initial: ExportSchedule | null
  saving: boolean
  error: string | null
  onSave: (request: ExportScheduleRequest) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<ExportScheduleRequest>(EMPTY_SCHEDULE_FORM)
  const [hydratedFor, setHydratedFor] = useState<string | null>(null)

  // Re-seed the form whenever the dialog opens for a different schedule.
  const key = open ? (initial?.id ?? 'new') : null
  if (key !== hydratedFor) {
    setHydratedFor(key)
    setForm(
      initial
        ? {
            name: initial.name,
            format: initial.format,
            frequency: initial.frequency,
            time: initial.time,
            dayOfWeek: initial.dayOfWeek ?? 1,
            dayOfMonth: initial.dayOfMonth ?? 1,
            timezone: initial.timezone,
            enabled: initial.enabled,
            filters: initial.filters ?? { archived: null },
            columns: initial.columns ?? [],
            destination: initial.destination,
          }
        : { ...EMPTY_SCHEDULE_FORM, timezone: browserTimezone() },
    )
  }

  const update = <K extends keyof ExportScheduleRequest>(field: K, value: ExportScheduleRequest[K]) =>
    setForm((current) => ({ ...current, [field]: value }))

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initial ? 'Edit schedule' : 'New export schedule'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(form)} disabled={saving || !form.name.trim()}>
            {saving ? <Spinner className="border-white/40 border-t-white" /> : 'Save schedule'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {error && <ErrorNote message={error} />}

        <Field label="Name" required htmlFor="schedule-name">
          <Input
            id="schedule-name"
            value={form.name}
            placeholder="Daily applications backup"
            onChange={(e) => update('name', e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Format" htmlFor="schedule-format">
            <Select
              id="schedule-format"
              value={form.format}
              onChange={(e) => update('format', e.target.value as ExportFormat)}
            >
              {EXPORT_FORMATS.map((format) => (
                <option key={format} value={format}>
                  {format}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Frequency" htmlFor="schedule-frequency">
            <Select
              id="schedule-frequency"
              value={form.frequency}
              onChange={(e) => update('frequency', e.target.value as ExportFrequency)}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </Select>
          </Field>

          {form.frequency === 'WEEKLY' && (
            <Field label="Day of week" htmlFor="schedule-day-of-week">
              <Select
                id="schedule-day-of-week"
                value={String(form.dayOfWeek ?? 1)}
                onChange={(e) => update('dayOfWeek', Number(e.target.value))}
              >
                {WEEKDAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          {form.frequency === 'MONTHLY' && (
            <Field label="Day of month" hint="1–28" htmlFor="schedule-day-of-month">
              <Input
                id="schedule-day-of-month"
                className="mono"
                type="number"
                min={1}
                max={28}
                value={form.dayOfMonth ?? 1}
                onChange={(e) => update('dayOfMonth', Number(e.target.value))}
              />
            </Field>
          )}

          <Field label="Time" htmlFor="schedule-time">
            <Input
              id="schedule-time"
              className="mono"
              type="time"
              value={form.time}
              onChange={(e) => update('time', e.target.value)}
            />
          </Field>

          <Field label="Timezone" htmlFor="schedule-timezone">
            <Input
              id="schedule-timezone"
              className="mono"
              value={form.timezone ?? ''}
              onChange={(e) => update('timezone', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Archive" htmlFor="schedule-archive">
          <Select
            id="schedule-archive"
            value={scopeFromArchived(form.filters?.archived)}
            onChange={(e) =>
              update('filters', {
                ...form.filters,
                archived: archivedFromScope(e.target.value as ArchiveScope),
              })
            }
          >
            {ARCHIVE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Destination" hint="More destinations are coming later." htmlFor="schedule-destination">
          <Select id="schedule-destination" value={form.destination} disabled>
            <option value="GOOGLE_DRIVE">Google Drive</option>
          </Select>
        </Field>

        <div className="flex items-center gap-3">
          <Switch
            checked={form.enabled !== false}
            onChange={(checked) => update('enabled', checked)}
            aria-label="Schedule enabled"
          />
          <span className="text-[13px] text-mono-5">Enabled</span>
        </div>
      </div>
    </Dialog>
  )
}

function SchedulesPanel({ onExecutionStarted }: { onExecutionStarted: () => void }) {
  const { data: schedules, loading, reload } = useAsync<ExportSchedule[]>(
    () => getExportSchedules().catch(() => []),
    [],
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ExportSchedule | null>(null)
  const [saving, setSaving] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ExportSchedule | null>(null)

  const openCreate = () => {
    setEditing(null)
    setDialogError(null)
    setDialogOpen(true)
  }

  const openEdit = (schedule: ExportSchedule) => {
    setEditing(schedule)
    setDialogError(null)
    setDialogOpen(true)
  }

  const handleSave = async (request: ExportScheduleRequest) => {
    setSaving(true)
    setDialogError(null)
    try {
      if (editing) {
        await updateExportSchedule(editing.id, request)
      } else {
        await createExportSchedule(request)
      }
      setDialogOpen(false)
      reload()
    } catch (err) {
      const message =
        typeof err === 'object' && err && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null
      setDialogError(message || 'Could not save the schedule.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (schedule: ExportSchedule, enabled: boolean) => {
    setBusyId(schedule.id)
    setError(null)
    try {
      await setExportScheduleEnabled(schedule.id, enabled)
      reload()
    } catch {
      setError('Could not update the schedule.')
    } finally {
      setBusyId(null)
    }
  }

  const handleRunNow = async (schedule: ExportSchedule) => {
    setBusyId(schedule.id)
    setError(null)
    try {
      await runExportScheduleNow(schedule.id)
      onExecutionStarted()
      reload()
    } catch (err) {
      const status =
        typeof err === 'object' && err && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined
      setError(
        status === 409
          ? 'This schedule is already running. Check the history in a moment.'
          : 'Could not start the export.',
      )
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (schedule: ExportSchedule) => {
    setConfirmDelete(null)
    setBusyId(schedule.id)
    setError(null)
    try {
      await deleteExportSchedule(schedule.id)
      reload()
    } catch {
      setError('Could not delete the schedule.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Panel>
      <PanelHead
        title="Scheduled exports"
        count={schedules?.length ?? 0}
        right={
          <Button size="sm" onClick={openCreate}>
            + New schedule
          </Button>
        }
      />
      <div className="p-4">
        {error && (
          <div className="mb-3">
            <ErrorNote message={error} />
          </div>
        )}

        {loading ? (
          <CenteredSpinner />
        ) : schedules && schedules.length > 0 ? (
          <div className="flex flex-col divide-y divide-mono-e5 overflow-hidden rounded border border-mono-e5">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
                <div className="min-w-[180px] flex-1">
                  <div className="truncate text-[13.5px] font-medium">{schedule.name}</div>
                  <div className="mono truncate text-[11.5px] text-mono-9">
                    {describeSchedule(schedule)} · {schedule.format} · Google Drive
                  </div>
                  <div className="mono truncate text-[11px] text-mono-9">
                    {schedule.enabled
                      ? `Next run ${formatDateTime(schedule.nextRunAt)}`
                      : 'Paused'}
                    {schedule.lastRunAt ? ` · Last run ${formatDateTime(schedule.lastRunAt)}` : ''}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={schedule.enabled}
                    onChange={(checked) => handleToggle(schedule, checked)}
                    aria-label={`Enable ${schedule.name}`}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleRunNow(schedule)}
                    disabled={busyId === schedule.id || schedule.running}
                  >
                    {busyId === schedule.id ? <Spinner /> : 'Run now'}
                  </Button>
                  <Button size="sm" onClick={() => openEdit(schedule)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="text-danger"
                    onClick={() => setConfirmDelete(schedule)}
                    disabled={busyId === schedule.id}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center font-mono text-[11.5px] text-mono-9">
            No schedules yet. Create one to back your applications up to Google Drive automatically.
          </div>
        )}
      </div>

      <ScheduleDialog
        open={dialogOpen}
        initial={editing}
        saving={saving}
        error={dialogError}
        onSave={handleSave}
        onClose={() => setDialogOpen(false)}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this schedule?"
        message="The recurring export stops immediately. Past runs stay in the history."
        confirmLabel="Delete"
        destructive
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </Panel>
  )
}

const STATUS_TONE: Record<ExportExecution['status'], string> = {
  SUCCESS: 'text-mono-1',
  FAILED: 'text-danger',
  RUNNING: 'text-mono-5',
  PENDING: 'text-mono-9',
}

function HistoryPanel({ refreshKey }: { refreshKey: number }) {
  const { data, loading, reload } = useAsync<ExportExecutionPage>(
    () =>
      getExportHistory().catch(() => ({
        executions: [],
        pageNumber: 0,
        pageSize: 20,
        totalElements: 0,
        totalPages: 0,
      })),
    [refreshKey],
  )

  const executions = data?.executions ?? []

  return (
    <Panel>
      <PanelHead
        title="History"
        count={data?.totalElements ?? 0}
        right={
          <Button size="sm" onClick={reload}>
            Refresh
          </Button>
        }
      />
      <div className="p-4">
        {loading ? (
          <CenteredSpinner />
        ) : executions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[12.5px]">
              <thead>
                <tr className="border-b border-mono-e5 text-left text-[11px] uppercase tracking-wide text-mono-9">
                  <th className="py-2 pr-3 font-medium">Started</th>
                  <th className="py-2 pr-3 font-medium">Source</th>
                  <th className="py-2 pr-3 font-medium">Format</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Rows</th>
                  <th className="py-2 font-medium">File</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((execution) => (
                  <tr key={execution.id} className="border-b border-mono-e5 last:border-b-0">
                    <td className="py-2 pr-3 font-mono text-[11.5px] text-mono-9">
                      {formatDateTime(execution.startedAt)}
                    </td>
                    <td className="py-2 pr-3">
                      {execution.trigger === 'MANUAL'
                        ? 'Manual download'
                        : execution.scheduleName || 'Schedule'}
                      {execution.trigger === 'RUN_NOW' && (
                        <span className="ml-1 font-mono text-[10.5px] text-mono-9">run now</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 font-mono text-[11.5px]">{execution.format}</td>
                    <td className={cn('py-2 pr-3 font-mono text-[11.5px]', STATUS_TONE[execution.status])}>
                      {execution.status}
                      {execution.errorMessage && (
                        <div className="max-w-[260px] truncate text-[11px] text-mono-9" title={execution.errorMessage}>
                          {execution.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-3 font-mono text-[11.5px]">
                      {execution.recordCount ?? '—'}
                      {execution.truncated && (
                        <span className="ml-1 text-[10.5px] text-mono-9">(capped)</span>
                      )}
                    </td>
                    <td className="py-2">
                      {execution.fileUrl ? (
                        <a
                          className="underline underline-offset-2"
                          href={execution.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {execution.fileName}
                        </a>
                      ) : (
                        <span className="text-mono-9">{execution.fileName ?? '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center font-mono text-[11.5px] text-mono-9">
            No exports yet.
          </div>
        )}
      </div>
    </Panel>
  )
}

export default function Exports() {
  const { data: statuses } = useAsync<string[]>(() => getStatuses().catch(() => []), [])
  const [historyKey, setHistoryKey] = useState(0)
  const refreshHistory = useCallback(() => setHistoryKey((key) => key + 1), [])

  return (
    <Page>
      <PageHeader
        title="Exports"
        sub="Download your applications or schedule recurring backups to Google Drive"
      />

      <ManualExportPanel statuses={statuses ?? []} onExported={refreshHistory} />

      <SectionLabel title="Automation" />
      <SchedulesPanel onExecutionStarted={refreshHistory} />

      <SectionLabel title="Export history" />
      <HistoryPanel refreshKey={historyKey} />
    </Page>
  )
}
