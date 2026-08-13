import { api, unwrap } from '@/lib/api'
import type {
  ExportColumnOption,
  ExportExecution,
  ExportExecutionPage,
  ExportRequest,
  ExportSchedule,
  ExportScheduleRequest,
} from '@/types'

export interface DownloadedExport {
  blob: Blob
  fileName: string
  recordCount: number
  /** True when the backend's record ceiling capped the file. */
  truncated: boolean
}

/** RFC 5987 `filename*=UTF-8''…` first, plain `filename="…"` as a fallback. */
function parseFileName(disposition?: string): string | null {
  if (!disposition) return null
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
  if (encoded) return decodeURIComponent(encoded[1].trim())
  const plain = /filename="?([^";]+)"?/i.exec(disposition)
  return plain ? plain[1].trim() : null
}

export async function downloadApplicationsExport(request: ExportRequest): Promise<DownloadedExport> {
  const response = await api.post('/exports/applications', request, { responseType: 'blob' })
  const headers = response.headers as Record<string, string | undefined>
  return {
    blob: response.data as Blob,
    fileName:
      parseFileName(headers['content-disposition']) ??
      `applywell-applications.${request.format.toLowerCase()}`,
    recordCount: Number(headers['x-export-record-count'] ?? 0),
    truncated: headers['x-export-truncated'] === 'true',
  }
}

export const getExportColumns = () =>
  unwrap(api.get<ExportColumnOption[]>('/exports/columns'))

export const getExportHistory = (page = 0, size = 20) =>
  unwrap(api.get<ExportExecutionPage>('/exports/history', { params: { page, size } }))

export const getExportSchedules = () =>
  unwrap(api.get<ExportSchedule[]>('/export-schedules'))

export const createExportSchedule = (data: ExportScheduleRequest) =>
  unwrap(api.post<ExportSchedule>('/export-schedules', data))

export const updateExportSchedule = (id: string, data: ExportScheduleRequest) =>
  unwrap(api.put<ExportSchedule>(`/export-schedules/${id}`, data))

export const setExportScheduleEnabled = (id: string, enabled: boolean) =>
  unwrap(api.patch<ExportSchedule>(`/export-schedules/${id}/enabled`, { enabled }))

export const deleteExportSchedule = (id: string) =>
  api.delete(`/export-schedules/${id}`)

export const runExportScheduleNow = (id: string) =>
  unwrap(api.post<ExportExecution>(`/export-schedules/${id}/run-now`, {}))
