/** Date/time formatting helpers. All tolerate null/empty input. */

const MONTH_DAY: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit' }

function parse(value?: string | null): Date | null {
  if (!value) return null
  // "YYYY-MM-DD" is parsed as UTC midnight by spec; use local time to avoid off-by-one in negative-offset timezones
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  // "DD/MM/YYYY" — tolerated for backwards compatibility with older payloads
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [d, m, y] = value.split('/').map(Number)
    return new Date(y, m - 1, d)
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** "May 28" */
export function formatDate(value?: string | null, fallback = '—'): string {
  const d = parse(value)
  return d ? d.toLocaleDateString('en-US', MONTH_DAY) : fallback
}

/** "Jun 06 · 14:30" */
export function formatDateTime(value?: string | null, fallback = '—'): string {
  const d = parse(value)
  if (!d) return fallback
  const date = d.toLocaleDateString('en-US', MONTH_DAY)
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date} · ${time}`
}

/** "value" formatted for a date <input type="date"> (yyyy-mm-dd). */
export function toDateInputValue(value?: string | null): string {
  const d = parse(value)
  if (!d) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "value" formatted as "yyyy-MM-dd" for the backend. Returns null for empty/invalid input. */
export function toApiDate(value?: string | null): string | null {
  const d = parse(value)
  if (!d) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** "value" formatted for a datetime-local input. */
export function toDateTimeInputValue(value?: string | null): string {
  const d = parse(value)
  if (!d) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}

/** Whole-day difference from now; negative means overdue. */
export function daysFromNow(value?: string | null): number | null {
  const d = parse(value)
  if (!d) return null
  const ms = d.getTime() - Date.now()
  return Math.round(ms / 86_400_000)
}

/** "3d overdue" / "in 2d" / "today" */
export function relativeDue(value?: string | null): string {
  const days = daysFromNow(value)
  if (days === null) return '—'
  if (days === 0) return 'today'
  if (days < 0) return `${Math.abs(days)}d overdue`
  return `in ${days}d`
}
