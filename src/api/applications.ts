import { api, unwrap } from '@/lib/api'
import type {
  Application,
  ApplicationPage,
  ApplicationPatch,
  ApplicationQuery,
  ApplicationRequest,
  LinkMetadata,
} from '@/types'

export const getApplications = (params?: ApplicationQuery) =>
  unwrap(api.get<ApplicationPage>('/applications', { params }))

export const getApplication = (id: string) =>
  unwrap(api.get<Application>(`/applications/${id}`))

export const createApplication = (data: ApplicationRequest) =>
  unwrap(api.post<Application>('/applications', data))

export const updateApplication = (id: string, data: ApplicationRequest) =>
  unwrap(api.put<Application>(`/applications/${id}`, data))

export const updateStatus = (id: string, status: string) =>
  unwrap(api.patch<Application>(`/applications/${id}/status`, { status }))

export const updateReminder = (id: string, recruiterDmReminderEnabled: boolean) =>
  unwrap(api.patch<Application>(`/applications/${id}/reminder`, { recruiterDmReminderEnabled }))

export const markDmSent = (id: string) =>
  unwrap(api.patch<Application>(`/applications/${id}/mark-dm-sent`, {}))

/**
 * Partial update. Send only the fields that should change — the backend keeps
 * the stored value for every key that is absent from the body, so padding the
 * payload with untouched fields is both unnecessary and lossy.
 *
 * The response omits `archivedAt` entirely once it is cleared, so read it as
 * "absent" rather than "null".
 */
export const patchApplication = (id: string, patch: ApplicationPatch) =>
  unwrap(api.patch<Application>(`/applications/${id}`, patch))

/** Move an application into the archive. Its status is left untouched. */
export const archiveApplication = (id: string) => patchApplication(id, { archived: true })

/** Bring an archived application back to the active list, status unchanged. */
export const restoreApplication = (id: string) => patchApplication(id, { archived: false })

export const deleteApplication = (id: string) =>
  unwrap(api.delete(`/applications/${id}`))

export const getUpcoming = () =>
  unwrap(api.get<Application[]>('/applications/upcoming'))

export const getOverdue = () =>
  unwrap(api.get<Application[]>('/applications/overdue'))

export const getLinkMetadata = (url: string) =>
  unwrap(api.get<LinkMetadata>('/applications/link-metadata', { params: { url } }))

export const getStatuses = () =>
  unwrap(api.get<string[]>('/applications/statuses'))
