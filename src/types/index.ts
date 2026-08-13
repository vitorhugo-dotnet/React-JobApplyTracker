/**
 * Domain types mirroring the SpringBoot-JobApplyTracker OpenAPI contract.
 * @see https://jobapply-api.hugojava.dev/v3/api-docs
 */

export interface User {
  id: string
  name: string
  email: string
  reminderTime?: string | null
  roles: string[]
  canUseGoogleIntegration: boolean
  privacyPolicyAccepted: boolean
}

export interface AuthResponse {
  accessToken: string
  user: User
}

/**
 * Canonical application status values served by GET /api/v1/applications/statuses.
 * Used as a static fallback for non-form UI (charts, labels, filters).
 * The ApplicationForm always fetches live values from the API.
 */
export const APPLICATION_STATUSES = [
  'RH',
  'Pending HR Response',
  'Pending Hiring Manager Response',
  'Technical Test',
  'Pending Technical Test Response',
  'Offer Negotiation',
  'Ghosting',
  'Rejected',
  'Approved',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

/** Pseudo-status the backend uses for drafts queued to send later. */
export const TO_SEND_LATER_STATUS = 'TO_SEND_LATER'

export interface Application {
  id: string
  vacancyName: string
  recruiterName?: string | null
  organization?: string | null
  vacancyLink?: string | null
  applicationDate?: string | null
  rhAcceptedConnection?: boolean
  interviewScheduled?: boolean
  nextStepDateTime?: string | null
  status: string | null
  previousStatus?: string | null
  recruiterDmReminderEnabled?: boolean
  recruiterDmSentAt?: string | null
  note?: string | null
  archived?: boolean
  archivedAt?: string | null
  driveResumeFileId?: string | null
  driveResumeFileName?: string | null
  driveResumeDocumentUrl?: string | null
  driveResumeGeneratedAt?: string | null
  toSendLater?: boolean
  interviewCount?: number
  createdAt?: string
  updatedAt?: string
}


export interface ApplicationRequest {
  vacancyName: string
  recruiterName?: string
  organization?: string
  vacancyLink?: string
  applicationDate?: string | null
  /** Required by the backend: whether the recruiter accepted the LinkedIn connection. */
  rhAcceptedConnection: boolean
  /** Required by the backend: whether an interview has been scheduled. */
  interviewScheduled: boolean
  nextStepDateTime?: string | null
  status: string | null
  /** Required by the backend: whether the recruiter DM reminder is enabled. */
  recruiterDmReminderEnabled: boolean
  note?: string
  interviewCount?: number
}

/**
 * Partial payload for PATCH /api/v1/applications/{id}. Only the keys present
 * are changed — anything omitted keeps its stored value, so callers must never
 * pad the body with flags they do not intend to touch. In particular, patching
 * `archived` leaves `status` exactly as it was.
 */
export interface ApplicationPatch {
  vacancyName?: string
  recruiterName?: string | null
  organization?: string | null
  vacancyLink?: string | null
  applicationDate?: string | null
  rhAcceptedConnection?: boolean
  interviewScheduled?: boolean
  nextStepDateTime?: string | null
  status?: string | null
  recruiterDmReminderEnabled?: boolean
  note?: string | null
  interviewCount?: number
  archived?: boolean
}

export interface ApplicationPage {
  applications: Application[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}

export interface ApplicationQuery {
  /** Global free-text query matched across every meaningful field on the backend. */
  search?: string
  status?: string
  vacancyName?: string
  recruiterName?: string
  organization?: string
  note?: string
  platform?: string
  applicationDateFrom?: string
  applicationDateTo?: string
  nextStepDateFrom?: string
  nextStepDateTo?: string
  interviewScheduled?: boolean
  recruiterDmReminderEnabled?: boolean
  rhAcceptedConnection?: boolean
  toSendLater?: boolean
  interviewCountMin?: number
  interviewCountMax?: number
  archived?: boolean
  page?: number
  size?: number
  sort?: string
}

export interface DashboardSummary {
  totalApplications: number
  waitingResponses: number
  interviewsScheduled: number
  interviewCount: number
  overdueFollowUps: number
  dmRemindersEnabled: number
  toSendLater: number
  rejectedCount: number
  ghostingCount: number
  averageDailyApplications: number
  averageWeeklyApplications: number
  averageMonthlyApplications: number
}

export interface GamificationProfile {
  currentXp: number
  level: number
  currentLevelXp: number
  nextLevelXp: number
  xpToNextLevel: number
  progressPercentage: number
  rankTitle: string
  streakDays: number
}

export interface Achievement {
  code: string
  name: string
  description: string
  icon?: string
  unlocked: boolean
  achievedAt?: string | null
}

export interface BaseResume {
  id: string
  name: string
  language?: string
  template?: boolean
  readOnly?: boolean
  createdAt?: string
}

export interface BaseInformation {
  id: string
  name: string
  docType?: string
  webViewLink?: string
  createdAt?: string
}

export interface LinkMetadata {
  title?: string
  description?: string
  image?: string
  domain?: string
}
