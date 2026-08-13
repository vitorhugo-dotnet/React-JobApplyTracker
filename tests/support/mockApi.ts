import type { Page, Route } from '@playwright/test'
import type { Application, ExportExecution, ExportSchedule } from '../../src/types'
import {
  ARCHIVED_APP,
  MOCK_ACHIEVEMENTS,
  MOCK_PROFILE,
  MOCK_SUMMARY,
  MOCK_USER,
  seedApplications,
} from './data'

const TOKEN = 'mock-access-token'

/** Seed a persisted zustand auth session so protected routes render. */
export async function seedAuth(page: Page): Promise<void> {
  await page.addInitScript(
    ([token, user]) => {
      localStorage.setItem(
        'applywell-auth',
        JSON.stringify({ state: { accessToken: token, user }, version: 0 }),
      )
    },
    [TOKEN, MOCK_USER] as const,
  )
}

interface MockOptions {
  /** Start with an empty application list (for empty-state tests). */
  empty?: boolean
}

/**
 * Install a stateful, in-memory mock of the backend. Mutations (create,
 * archive, delete) are reflected in subsequent reads within the same test.
 */
export async function installMockApi(page: Page, options: MockOptions = {}): Promise<void> {
  const active: Application[] = options.empty ? [] : seedApplications()
  const archived: Application[] = options.empty ? [] : [ARCHIVED_APP]
  const schedules: ExportSchedule[] = []
  const executions: ExportExecution[] = []

  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const method = request.method()
    const url = new URL(request.url())
    const path = url.pathname.replace(/^.*\/api\/v1/, '')
    const q = url.searchParams

    // ---- auth ----
    if (path === '/auth/login' && method === 'POST')
      return json(route, { accessToken: TOKEN, user: MOCK_USER })
    if (path === '/auth/register' && method === 'POST')
      return json(route, { accessToken: TOKEN, user: MOCK_USER })
    if (path === '/auth/me' && method === 'GET') return json(route, MOCK_USER)
    if (path === '/auth/me' && method === 'PUT') {
      const body = request.postDataJSON() as { name?: string; reminderTime?: string }
      return json(route, { ...MOCK_USER, ...body })
    }
    if (path === '/auth/me/password' && method === 'PUT') return json(route, { message: 'ok' })
    if (path === '/auth/logout' && method === 'POST') return json(route, { message: 'ok' })
    if (path === '/auth/forgot-password' && method === 'POST') return json(route, { message: 'ok' })

    // ---- dashboard + gamification ----
    if (path === '/dashboard/summary') return json(route, MOCK_SUMMARY)
    if (path === '/gamification/profile') return json(route, MOCK_PROFILE)
    if (path === '/gamification/achievements') return json(route, MOCK_ACHIEVEMENTS)

    // ---- google drive / resumes ----
    if (path === '/google-drive/base-resumes' && method === 'GET') return json(route, [])
    if (path === '/google-drive/status') return json(route, { connected: false })

    // ---- applications collection ----
    if (path === '/applications/statuses' && method === 'GET')
      return json(route, [
        'RH', 'Pending HR Response', 'Pending Hiring Manager Response',
        'Technical Test', 'Pending Technical Test Response',
        'Offer Negotiation', 'Ghosting', 'Rejected', 'Approved',
      ])

    if (path === '/applications/overdue')
      return json(route, active.filter((a) => a.nextStepDateTime && new Date(a.nextStepDateTime) < new Date()))
    if (path === '/applications/upcoming') return json(route, [])

    if (path === '/applications' && method === 'GET') {
      const isArchived = q.get('archived') === 'true'
      let list = (isArchived ? archived : active).slice()
      const status = q.get('status')
      if (status) list = list.filter((a) => a.status === status)
      const recruiter = q.get('recruiterName')
      if (recruiter)
        list = list.filter((a) => (a.recruiterName ?? '').toLowerCase().includes(recruiter.toLowerCase()))
      const search = q.get('search')
      if (search) {
        const needle = search.toLowerCase()
        list = list.filter((a) =>
          [a.vacancyName, a.organization, a.recruiterName, a.status, a.note]
            .some((field) => (field ?? '').toLowerCase().includes(needle)),
        )
      }

      const page = Number(q.get('page') ?? '0')
      const size = Number(q.get('size') ?? '12')
      const start = page * size
      const applications = list.slice(start, start + size)
      return json(route, {
        applications,
        pageNumber: page,
        pageSize: size,
        totalElements: list.length,
        totalPages: Math.max(1, Math.ceil(list.length / size)),
      })
    }

    if (path === '/applications' && method === 'POST') {
      const body = request.postDataJSON() as Partial<Application>
      const created: Application = {
        id: `app-${Date.now()}`,
        vacancyName: body.vacancyName ?? 'Untitled',
        status: body.status ?? 'RH',
        archived: false,
        ...body,
      } as Application
      active.unshift(created)
      return json(route, created, 201)
    }

    // ---- single application ----
    const idMatch = path.match(/^\/applications\/([^/]+)$/)
    if (idMatch) {
      const id = idMatch[1]
      const idx = active.findIndex((a) => a.id === id)
      if (method === 'GET') {
        const found = active[idx] ?? archived.find((a) => a.id === id)
        return found ? json(route, found) : json(route, { message: 'not found' }, 404)
      }
      if (method === 'PUT') {
        const body = request.postDataJSON() as Partial<Application>
        if (idx >= 0) active[idx] = { ...active[idx], ...body }
        return json(route, active[idx] ?? { id, ...body })
      }
      if (method === 'DELETE') {
        if (idx >= 0) active.splice(idx, 1)
        return route.fulfill({ status: 204, body: '' })
      }
    }

    const archiveMatch = path.match(/^\/applications\/([^/]+)\/archive$/)
    if (archiveMatch && method === 'PATCH') {
      const id = archiveMatch[1]
      const idx = active.findIndex((a) => a.id === id)
      if (idx >= 0) {
        const [app] = active.splice(idx, 1)
        archived.unshift({ ...app, archived: true })
        return json(route, app)
      }
    }

    const patchMatch = path.match(/^\/applications\/([^/]+)\/(status|reminder|mark-dm-sent)$/)
    if (patchMatch && method === 'PATCH') {
      const found = active.find((a) => a.id === patchMatch[1])
      return json(route, found ?? { id: patchMatch[1] })
    }

    // ---- exports ----
    if (path === '/exports/columns' && method === 'GET')
      return json(route, [
        { key: 'id', header: 'ID' },
        { key: 'vacancyName', header: 'Vacancy' },
        { key: 'organization', header: 'Organization' },
        { key: 'status', header: 'Status' },
        { key: 'note', header: 'Notes' },
      ])

    if (path === '/exports/history' && method === 'GET')
      return json(route, {
        executions,
        pageNumber: 0,
        pageSize: 20,
        totalElements: executions.length,
        totalPages: 1,
      })

    if (path === '/exports/applications' && method === 'POST') {
      const body = request.postDataJSON() as { format: 'CSV' | 'XLSX' }
      const rows = active.length
      const fileName = `applywell-applications-2026-07-16.${body.format.toLowerCase()}`
      executions.unshift({
        id: `exec-${executions.length + 1}`,
        trigger: 'MANUAL',
        format: body.format,
        status: 'SUCCESS',
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        recordCount: rows,
        truncated: false,
        fileName,
      })
      return route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        headers: {
          'content-disposition': `attachment; filename="${fileName}"`,
          'x-export-record-count': String(rows),
          'x-export-truncated': 'false',
        },
        body: `\uFEFFVacancy,Organization\r\nStaff Engineer,ACME\r\n`,
      })
    }

    if (path === '/export-schedules' && method === 'GET') return json(route, schedules)

    if (path === '/export-schedules' && method === 'POST') {
      const body = request.postDataJSON() as Partial<ExportSchedule>
      const created: ExportSchedule = {
        id: `schedule-${schedules.length + 1}`,
        name: body.name ?? 'Untitled',
        format: body.format ?? 'XLSX',
        frequency: body.frequency ?? 'DAILY',
        time: body.time ?? '20:00',
        dayOfWeek: body.dayOfWeek ?? null,
        dayOfMonth: body.dayOfMonth ?? null,
        timezone: body.timezone ?? 'America/Sao_Paulo',
        enabled: body.enabled !== false,
        destination: body.destination ?? 'GOOGLE_DRIVE',
        filters: body.filters ?? {},
        columns: body.columns ?? [],
        nextRunAt: new Date(Date.now() + 3_600_000).toISOString(),
        lastRunAt: null,
        running: false,
      }
      schedules.push(created)
      return json(route, created, 201)
    }

    const scheduleMatch = path.match(/^\/export-schedules\/([^/]+)$/)
    if (scheduleMatch) {
      const idx = schedules.findIndex((s) => s.id === scheduleMatch[1])
      if (method === 'PUT') {
        const body = request.postDataJSON() as Partial<ExportSchedule>
        if (idx >= 0) schedules[idx] = { ...schedules[idx], ...body }
        return json(route, schedules[idx])
      }
      if (method === 'DELETE') {
        if (idx >= 0) schedules.splice(idx, 1)
        return json(route, { message: 'Export schedule deleted successfully' })
      }
      if (method === 'GET' && idx >= 0) return json(route, schedules[idx])
    }

    const enabledMatch = path.match(/^\/export-schedules\/([^/]+)\/enabled$/)
    if (enabledMatch && method === 'PATCH') {
      const body = request.postDataJSON() as { enabled: boolean }
      const idx = schedules.findIndex((s) => s.id === enabledMatch[1])
      if (idx >= 0) {
        schedules[idx] = {
          ...schedules[idx],
          enabled: body.enabled,
          nextRunAt: body.enabled ? new Date(Date.now() + 3_600_000).toISOString() : null,
        }
        return json(route, schedules[idx])
      }
    }

    const runNowMatch = path.match(/^\/export-schedules\/([^/]+)\/run-now$/)
    if (runNowMatch && method === 'POST') {
      const schedule = schedules.find((s) => s.id === runNowMatch[1])
      const execution: ExportExecution = {
        id: `exec-${executions.length + 1}`,
        scheduleId: schedule?.id ?? null,
        scheduleName: schedule?.name ?? null,
        trigger: 'RUN_NOW',
        format: schedule?.format ?? 'XLSX',
        destination: 'GOOGLE_DRIVE',
        status: 'PENDING',
        startedAt: new Date().toISOString(),
        truncated: false,
      }
      executions.unshift(execution)
      return json(route, execution, 202)
    }

    // default: empty success
    return json(route, {})
  })
}

export { TOKEN }
