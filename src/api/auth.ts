import { api, unwrap } from '@/lib/api'
import type { AuthResponse, User } from '@/types'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  acceptedPrivacyPolicy: boolean
}

export const login = (data: LoginPayload) => unwrap(api.post<AuthResponse>('/auth/login', data))

export const register = (data: RegisterPayload) =>
  unwrap(api.post<AuthResponse>('/auth/register', data))

export const logout = () => unwrap(api.post('/auth/logout', {}))

export const me = () => unwrap(api.get<User>('/auth/me'))

export interface UpdateProfilePayload {
  name?: string
  reminderTime?: string
}

export const updateProfile = (data: UpdateProfilePayload) =>
  unwrap(api.put<User>('/auth/me', data))

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export const changePassword = (data: ChangePasswordPayload) =>
  unwrap(api.put('/auth/me/password', data))

export const forgotPassword = (email: string) =>
  unwrap(api.post('/auth/forgot-password', { email }))
