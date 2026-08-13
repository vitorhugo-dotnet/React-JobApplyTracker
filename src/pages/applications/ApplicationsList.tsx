import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page, PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Segmented } from '@/components/ui/Segmented'
import { Field, Input, Select } from '@/components/ui/Field'
import { Pager } from '@/components/ui/Pager'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { CenteredSpinner, EmptyState, ErrorNote, SuccessNote } from '@/components/ui/feedback'
import { FilterIcon, PlusIcon, SearchIcon } from '@/components/ui/icons'
import { cn, errorMessage } from '@/lib/utils'
import { STATUS_OPTIONS } from '@/lib/statuses'
import { useAsync } from '@/hooks/useAsync'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useIsMobile } from '@/hooks/useIsMobile'
import {
  archiveApplication,
  deleteApplication,
  getApplications,
  restoreApplication,
} from '@/api/applications'
import type { Application, ApplicationQuery } from '@/types'
import { ApplicationsTable, type SortState } from '@/components/applications/ApplicationsTable'
import { ApplicationsBoard } from '@/components/applications/ApplicationsBoard'
import { ApplicationsCards } from '@/components/applications/ApplicationsCards'

type Tab = 'active' | 'archived'
type View = 'table' | 'board'

const SORT_OPTIONS = [
  { value: 'applicationDate,desc', label: 'Sort: Applied date' },
  { value: 'nextStepDateTime,asc', label: 'Sort: Next step' },
  { value: 'status,asc', label: 'Sort: Status' },
  { value: 'vacancyName,asc', label: 'Sort: Vacancy A–Z' },
]

const PAGE_SIZE = 12

/** Per-field advanced filter form. Everything is stored as a string for controlled inputs. */
interface AdvancedFilters {
  status: string
  vacancyName: string
  recruiterName: string
  organization: string
  note: string
  platform: string
  applicationDateFrom: string
  applicationDateTo: string
  nextStepDateFrom: string
  nextStepDateTo: string
  interviewCountMin: string
  interviewCountMax: string
  /** tri-state: '' = any, 'true', 'false' */
  interviewScheduled: string
  recruiterDmReminderEnabled: string
  rhAcceptedConnection: string
  toSendLater: string
}

const EMPTY_ADVANCED: AdvancedFilters = {
  status: '',
  vacancyName: '',
  recruiterName: '',
  organization: '',
  note: '',
  platform: '',
  applicationDateFrom: '',
  applicationDateTo: '',
  nextStepDateFrom: '',
  nextStepDateTo: '',
  interviewCountMin: '',
  interviewCountMax: '',
  interviewScheduled: '',
  recruiterDmReminderEnabled: '',
  rhAcceptedConnection: '',
  toSendLater: '',
}

const text = (v: string): string | undefined => (v.trim() ? v.trim() : undefined)
const tri = (v: string): boolean | undefined => (v === '' ? undefined : v === 'true')
const count = (v: string): number | undefined => (v.trim() === '' ? undefined : Number(v))

export default function ApplicationsList() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [tab, setTab] = useState<Tab>('active')
  const [view, setView] = useState<View>('table')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('applicationDate,desc')
  const [page, setPage] = useState(0)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [advanced, setAdvanced] = useState<AdvancedFilters>(EMPTY_ADVANCED)
  const [pendingArchive, setPendingArchive] = useState<Application | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Application | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [restored, setRestored] = useState<string | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  /**
   * Bumped after every mutation. It is part of the loader deps, so it
   * invalidates *both* tab queries: the list on screen refetches immediately
   * and the other tab can never be served the result of a pre-mutation run.
   */
  const [dataVersion, setDataVersion] = useState(0)
  const invalidateApplications = () => setDataVersion((v) => v + 1)

  const debouncedSearch = useDebouncedValue(search, 350)
  const debouncedAdvanced = useDebouncedValue(advanced, 350)

  // On mobile viewport, always render the card view regardless of desktop selection
  const effectiveView = isMobile ? 'mobile' : view

  // Toggle between the single global search and the per-field advanced panel.
  // Opening one clears the other so the two filtering modes never fight.
  const openAdvanced = () => {
    setSearch('')
    setStatus('')
    setAdvancedOpen(true)
    setPage(0)
  }
  const closeAdvanced = () => {
    setAdvanced(EMPTY_ADVANCED)
    setAdvancedOpen(false)
    setPage(0)
  }
  const setAdv = (patch: Partial<AdvancedFilters>) => {
    setAdvanced((prev) => ({ ...prev, ...patch }))
    setPage(0)
  }

  const query: ApplicationQuery = useMemo(() => {
    const base: ApplicationQuery = {
      archived: tab === 'archived',
      sort,
      page,
      size: PAGE_SIZE,
    }
    if (advancedOpen) {
      const a = debouncedAdvanced
      return {
        ...base,
        status: text(a.status),
        vacancyName: text(a.vacancyName),
        recruiterName: text(a.recruiterName),
        organization: text(a.organization),
        note: text(a.note),
        platform: text(a.platform),
        applicationDateFrom: text(a.applicationDateFrom),
        applicationDateTo: text(a.applicationDateTo),
        nextStepDateFrom: text(a.nextStepDateFrom),
        nextStepDateTo: text(a.nextStepDateTo),
        interviewCountMin: count(a.interviewCountMin),
        interviewCountMax: count(a.interviewCountMax),
        interviewScheduled: tri(a.interviewScheduled),
        recruiterDmReminderEnabled: tri(a.recruiterDmReminderEnabled),
        rhAcceptedConnection: tri(a.rhAcceptedConnection),
        toSendLater: tri(a.toSendLater),
      }
    }
    return {
      ...base,
      search: debouncedSearch || undefined,
      status: status || undefined,
    }
  }, [tab, advancedOpen, debouncedSearch, debouncedAdvanced, status, sort, page])

  const { data, loading, error } = useAsync(
    () => getApplications(query),
    [query, dataVersion],
    'Could not load applications.',
  )

  const sortState: SortState = useMemo(() => {
    const [key, dir] = sort.split(',')
    return { key, dir: (dir as 'asc' | 'desc') ?? 'asc' }
  }, [sort])

  const onSortColumn = (key: string) => {
    setSort((prev) => {
      const [prevKey, prevDir] = prev.split(',')
      const dir = prevKey === key && prevDir === 'asc' ? 'desc' : 'asc'
      return `${key},${dir}`
    })
    setPage(0)
  }

  const items = data?.applications ?? []

  const confirmArchive = async () => {
    if (!pendingArchive) return
    await archiveApplication(pendingArchive.id)
    setPendingArchive(null)
    invalidateApplications()
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    await deleteApplication(pendingDelete.id)
    setPendingDelete(null)
    invalidateApplications()
  }

  /**
   * Restore sends the archive flag on its own — a partial patch — so the
   * stored status survives untouched. Archive visibility and status are
   * independent concerns and neither may drive the other.
   */
  const restore = async (app: Application) => {
    if (restoringId) return
    setRestoringId(app.id)
    setRestored(null)
    setRestoreError(null)
    try {
      await restoreApplication(app.id)
      setRestored(app.vacancyName)
      invalidateApplications()
    } catch (err) {
      setRestoreError(errorMessage(err, `Could not restore "${app.vacancyName}". Please try again.`))
    } finally {
      setRestoringId(null)
    }
  }

  const tabCount = data?.totalElements ?? 0

  return (
    <Page>
      <PageHeader
        title="Applications"
        sub="Track every vacancy from draft to offer"
        actions={
          <Button variant="primary" onClick={() => navigate('/applications/new')}>
            <PlusIcon /> New Application
          </Button>
        }
      />

      {/* tabs */}
      <div className="mb-4 flex gap-0.5 border-b border-mono-e5">
        {(['active', 'archived'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t)
              setPage(0)
              setRestored(null)
              setRestoreError(null)
            }}
            className={cn(
              '-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[13.5px] capitalize',
              tab === t
                ? 'border-mono-0 font-semibold text-mono-0'
                : 'border-transparent text-mono-9 hover:text-mono-2',
            )}
          >
            {t}
            {tab === t && (
              <span className="rounded-full bg-mono-f5 px-[7px] py-px font-mono text-[11px] text-mono-9">
                {tabCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {!advancedOpen && (
          <>
            <label className="flex min-w-[180px] max-w-[360px] flex-1 items-center gap-2 rounded border border-mono-e5 px-3 py-[7px] text-mono-9">
              <SearchIcon />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                placeholder="Search every field…"
                className="w-full border-0 bg-transparent text-[13.5px] text-mono-1 outline-none placeholder:text-mono-9"
              />
            </label>
            <Select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(0)
              }}
              className="w-auto min-w-[140px]"
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </>
        )}
        <Button
          variant={advancedOpen ? 'primary' : 'ghost'}
          onClick={advancedOpen ? closeAdvanced : openAdvanced}
        >
          <FilterIcon /> {advancedOpen ? 'Hide filters' : 'Advanced'}
        </Button>
        <Select
          aria-label="Sort applications"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value)
            setPage(0)
          }}
          className="w-auto min-w-[140px]"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {/* view toggle — only shown on desktop */}
        {!isMobile && (
          <>
            <div className="flex-1" />
            <Segmented<View>
              aria-label="View mode"
              options={[
                { value: 'table', label: 'Table' },
                { value: 'board', label: 'Board' },
              ]}
              value={view}
              onChange={setView}
            />
          </>
        )}
      </div>

      {/* advanced filter panel — one control per application field */}
      {advancedOpen && (
        <div className="mb-4 rounded border border-mono-e5 bg-[#fafaf7] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-mono-1">Advanced filters</h2>
            <button
              type="button"
              onClick={() => {
                setAdvanced(EMPTY_ADVANCED)
                setPage(0)
              }}
              className="text-[12px] text-mono-9 underline-offset-2 hover:text-mono-2 hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Vacancy name" htmlFor="f-vacancy">
              <Input
                id="f-vacancy"
                value={advanced.vacancyName}
                onChange={(e) => setAdv({ vacancyName: e.target.value })}
              />
            </Field>
            <Field label="Recruiter name" htmlFor="f-recruiter">
              <Input
                id="f-recruiter"
                value={advanced.recruiterName}
                onChange={(e) => setAdv({ recruiterName: e.target.value })}
              />
            </Field>
            <Field label="Organization" htmlFor="f-org">
              <Input
                id="f-org"
                value={advanced.organization}
                onChange={(e) => setAdv({ organization: e.target.value })}
              />
            </Field>
            <Field label="Platform" htmlFor="f-platform">
              <Input
                id="f-platform"
                value={advanced.platform}
                onChange={(e) => setAdv({ platform: e.target.value })}
              />
            </Field>
            <Field label="Note" htmlFor="f-note">
              <Input
                id="f-note"
                value={advanced.note}
                onChange={(e) => setAdv({ note: e.target.value })}
              />
            </Field>
            <Field label="Status" htmlFor="f-status">
              <Select
                id="f-status"
                value={advanced.status}
                onChange={(e) => setAdv({ status: e.target.value })}
              >
                <option value="">Any status</option>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Applied from" htmlFor="f-appfrom">
              <Input
                id="f-appfrom"
                type="date"
                value={advanced.applicationDateFrom}
                onChange={(e) => setAdv({ applicationDateFrom: e.target.value })}
              />
            </Field>
            <Field label="Applied to" htmlFor="f-appto">
              <Input
                id="f-appto"
                type="date"
                value={advanced.applicationDateTo}
                onChange={(e) => setAdv({ applicationDateTo: e.target.value })}
              />
            </Field>
            <div className="hidden lg:block" />
            <Field label="Next step from" htmlFor="f-nsfrom">
              <Input
                id="f-nsfrom"
                type="date"
                value={advanced.nextStepDateFrom}
                onChange={(e) => setAdv({ nextStepDateFrom: e.target.value })}
              />
            </Field>
            <Field label="Next step to" htmlFor="f-nsto">
              <Input
                id="f-nsto"
                type="date"
                value={advanced.nextStepDateTo}
                onChange={(e) => setAdv({ nextStepDateTo: e.target.value })}
              />
            </Field>
            <div className="hidden lg:block" />
            <Field label="Min interviews" htmlFor="f-icmin">
              <Input
                id="f-icmin"
                type="number"
                min={0}
                value={advanced.interviewCountMin}
                onChange={(e) => setAdv({ interviewCountMin: e.target.value })}
              />
            </Field>
            <Field label="Max interviews" htmlFor="f-icmax">
              <Input
                id="f-icmax"
                type="number"
                min={0}
                value={advanced.interviewCountMax}
                onChange={(e) => setAdv({ interviewCountMax: e.target.value })}
              />
            </Field>
            <div className="hidden lg:block" />
            <Field label="Interview scheduled" htmlFor="f-interview">
              <Select
                id="f-interview"
                value={advanced.interviewScheduled}
                onChange={(e) => setAdv({ interviewScheduled: e.target.value })}
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </Field>
            <Field label="DM reminder enabled" htmlFor="f-reminder">
              <Select
                id="f-reminder"
                value={advanced.recruiterDmReminderEnabled}
                onChange={(e) => setAdv({ recruiterDmReminderEnabled: e.target.value })}
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </Field>
            <Field label="Recruiter accepted" htmlFor="f-accepted">
              <Select
                id="f-accepted"
                value={advanced.rhAcceptedConnection}
                onChange={(e) => setAdv({ rhAcceptedConnection: e.target.value })}
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </Field>
            <Field label="To send later" htmlFor="f-tosend">
              <Select
                id="f-tosend"
                value={advanced.toSendLater}
                onChange={(e) => setAdv({ toSendLater: e.target.value })}
              >
                <option value="">Any</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </Field>
          </div>
        </div>
      )}

      {/* feedback for the row actions, kept above the list so it survives a refetch */}
      {restored && (
        <div className="mb-4">
          <SuccessNote message={`"${restored}" was restored to your active applications.`} />
        </div>
      )}
      {restoreError && (
        <div className="mb-4">
          <ErrorNote message={restoreError} />
        </div>
      )}

      {loading && <CenteredSpinner label="Loading applications…" />}
      {error && !loading && <ErrorNote message={error} />}

      {data && !loading && !error && (
        <>
          {items.length === 0 ? (
            <EmptyState
              title={tab === 'archived' ? 'No archived applications' : 'No applications yet'}
              description={
                tab === 'archived'
                  ? 'Applications you archive will live here, keeping your active list focused without deleting history.'
                  : 'Start tracking a vacancy you are applying to.'
              }
              action={
                <Button variant="primary" onClick={() => navigate('/applications/new')}>
                  <PlusIcon /> New Application
                </Button>
              }
            />
          ) : effectiveView === 'board' ? (
            <ApplicationsBoard items={items} />
          ) : effectiveView === 'mobile' ? (
            <ApplicationsCards
              items={items}
              archived={tab === 'archived'}
              onRestore={restore}
              busyId={restoringId}
            />
          ) : (
            <>
              <ApplicationsTable
                items={items}
                sort={sortState}
                onSort={onSortColumn}
                onEdit={(app) => navigate(`/applications/${app.id}/edit`)}
                onArchive={setPendingArchive}
                onRestore={restore}
                onDelete={setPendingDelete}
                archived={tab === 'archived'}
                busyId={restoringId}
              />
              <div className="rounded-b border-x border-b border-mono-e5">
                <Pager
                  page={data.pageNumber}
                  totalPages={data.totalPages}
                  totalElements={data.totalElements}
                  pageSize={data.pageSize}
                  onChange={setPage}
                />
              </div>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!pendingArchive}
        title="Archive application?"
        message={`"${pendingArchive?.vacancyName}" will move to your archived list. You can restore it later.`}
        confirmLabel="Archive"
        onConfirm={confirmArchive}
        onCancel={() => setPendingArchive(null)}
      />
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete application?"
        message={`"${pendingDelete?.vacancyName}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Page>
  )
}
