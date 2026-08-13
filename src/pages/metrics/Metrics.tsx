import { useMemo, useState } from 'react'
import { Page, PageHeader } from '@/components/ui/PageHeader'
import { Panel, PanelHead } from '@/components/ui/Panel'
import { Select } from '@/components/ui/Field'
import { CenteredSpinner, ErrorNote } from '@/components/ui/feedback'
import { CalendarIcon } from '@/components/ui/icons'
import { useAsync } from '@/hooks/useAsync'
import { getApplications } from '@/api/applications'
import { getDashboardSummary } from '@/api/dashboard'
import { familyOf, STATUS_FAMILY_LABEL, STATUS_FAMILY_ORDER, STATUS_SHORT_LABEL, STATUS_DISPLAY_ORDER } from '@/lib/statuses'
import type { Application } from '@/types'
import { Funnel, LineChart, HBars, type Bar } from '@/components/metrics/charts'

const RANGES = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '365', label: 'Last 12 months' },
  { value: 'all', label: 'All time' },
]

function withinRange(app: Application, days: number | null): boolean {
  if (days === null) return true
  if (!app.applicationDate) return false
  const t = new Date(app.applicationDate).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t <= days * 86_400_000
}

function weeklyVolume(apps: Application[]): { label: string; value: number }[] {
  const weeks = 12
  const buckets = new Array(weeks).fill(0)
  const now = Date.now()
  for (const app of apps) {
    if (!app.applicationDate) continue
    const t = new Date(app.applicationDate).getTime()
    if (Number.isNaN(t)) continue
    const weeksAgo = Math.floor((now - t) / (7 * 86_400_000))
    if (weeksAgo >= 0 && weeksAgo < weeks) buckets[weeks - 1 - weeksAgo] += 1
  }
  return buckets.map((value, i) => ({ label: `W${i + 1}`, value }))
}

export default function Metrics() {
  const [range, setRange] = useState('90')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, loading, error } = useAsync(
    async () => {
      const [summary, page] = await Promise.all([
        getDashboardSummary(),
        getApplications({ archived: false, size: 500 }),
      ])
      return { summary, apps: page.applications ?? [] }
    },
    [],
    'Could not load metrics.',
  )

  const computed = useMemo(() => {
    if (!data) return null
    const days = range === 'all' ? null : Number(range)
    let apps = data.apps.filter((a) => withinRange(a, days))
    if (statusFilter) apps = apps.filter((a) => familyOf(a.status) === statusFilter)

    const counts: Record<string, number> = {}
    for (const fam of STATUS_FAMILY_ORDER) counts[fam] = 0
    for (const app of apps) counts[familyOf(app.status)] += 1

    const statusCounts: Record<string, number> = {}
    for (const app of apps) {
      const s = app.status ?? 'To Send Later'
      statusCounts[s] = (statusCounts[s] || 0) + 1
    }

    const total = apps.length
    const reached = (...fams: string[]) => fams.reduce((sum, f) => sum + (counts[f] || 0), 0)

    const funnel = [
      { label: 'Applications', value: total },
      { label: 'Applied', value: total - counts.draft },
      { label: 'Interview', value: reached('replied', 'interview', 'offer') },
      { label: 'Tech Test', value: reached('interview', 'offer') },
      { label: 'Offer', value: counts.offer },
    ]

    const byStatus: Bar[] = STATUS_DISPLAY_ORDER
      .filter((s) => (statusCounts[s] ?? 0) > 0)
      .map((s) => ({
        label: STATUS_SHORT_LABEL[s] ?? s,
        value: statusCounts[s] ?? 0,
      }))

    return { funnel, byStatus, weekly: weeklyVolume(apps), total }
  }, [data, range, statusFilter])

  return (
    <Page>
      <PageHeader title="Metrics" sub="Conversion and activity across your applications" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2 rounded border border-mono-e5 bg-mono-w px-2.5 py-[7px] text-[12.5px] text-mono-5">
          <CalendarIcon />
          <select
            aria-label="Date range"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="cursor-pointer border-0 bg-transparent text-[12.5px] outline-none"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </span>
        <Select
          aria-label="Status family filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto min-w-[150px]"
        >
          <option value="">All statuses</option>
          {STATUS_FAMILY_ORDER.map((fam) => (
            <option key={fam} value={fam}>
              {STATUS_FAMILY_LABEL[fam]}
            </option>
          ))}
        </Select>
      </div>

      {loading && <CenteredSpinner label="Crunching numbers…" />}
      {error && !loading && <ErrorNote message={error} />}

      {data && computed && !loading && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Panel className="lg:col-span-2">
            <PanelHead title="Conversion Funnel" count="applied → offer" />
            <div className="px-[18px] pb-5 pt-[18px]">
              <Funnel steps={computed.funnel} />
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Applications by Status" />
            <div className="px-[18px] pb-5 pt-[18px]">
              <HBars bars={computed.byStatus} />
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Pipeline Averages" />
            <div className="grid grid-cols-2 gap-4 px-[18px] py-5">
              <Stat label="Avg / day" value={data.summary.averageDailyApplications.toFixed(1)} />
              <Stat label="Avg / week" value={data.summary.averageWeeklyApplications.toFixed(1)} />
              <Stat label="Avg / month" value={data.summary.averageMonthlyApplications.toFixed(1)} />
              <Stat label="DM reminders on" value={String(data.summary.dmRemindersEnabled)} />
            </div>
          </Panel>

          <Panel className="lg:col-span-2">
            <PanelHead title="Weekly Application Volume" count="last 12 weeks" />
            <div className="px-[18px] pb-5 pt-[18px]">
              <LineChart points={computed.weekly} />
            </div>
          </Panel>
        </div>
      )}
    </Page>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[24px] font-semibold leading-none">{value}</div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.05em] text-mono-9">{label}</div>
    </div>
  )
}
