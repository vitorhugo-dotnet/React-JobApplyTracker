import { api, unwrap } from '@/lib/api'
import type { BaseResume, BaseInformation } from '@/types'

export const getBaseResumes = () =>
  unwrap(api.get<BaseResume[]>('/google-drive/base-resumes'))

export const createBaseResume = (data: {
  documentIdOrUrl: string
  language?: string
  template: boolean
}) => unwrap(api.post<BaseResume>('/google-drive/base-resumes', data))

export const deleteBaseResume = (id: string) =>
  api.delete(`/google-drive/base-resumes/${id}`)

export const getBaseInformation = () =>
  unwrap(api.get<BaseInformation[]>('/google-drive/base-information'))

export const createBaseInformation = (data: { documentIdOrUrl: string }) =>
  unwrap(api.post<BaseInformation>('/google-drive/base-information', data))

export const deleteBaseInformation = (id: string) =>
  api.delete(`/google-drive/base-information/${id}`)

export interface GoogleDriveStatus {
  connected: boolean
  email?: string
  rootFolderId?: string
  rootFolderName?: string
  fileCount?: number
  lastSyncedAt?: string
}

export const getGoogleDriveStatus = () =>
  unwrap(api.get<GoogleDriveStatus>('/google-drive/status'))

export const updateRootFolder = (folderIdOrUrl: string) =>
  unwrap(api.put<GoogleDriveStatus>('/google-drive/root-folder', { folderIdOrUrl }))

export interface GoogleDriveOAuthStart {
  authorizationUrl: string
  state: string
  redirectUri: string
  scopes: string[]
}

export const startGoogleDriveOAuth = () =>
  unwrap(api.post<GoogleDriveOAuthStart>('/google-drive/oauth/start'))

export const disconnectGoogleDrive = () =>
  api.delete('/google-drive/connection')
