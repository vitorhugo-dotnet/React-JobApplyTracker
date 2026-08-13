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

/* ── Exports ─────────────────────────────────────────────────────────────── */

export const EXPORT_FORMATS = ['CSV', 'XLSX'] as const
export type ExportFormat = (typeof EXPORT_FORMATS)[number]

export type ExportFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY'
export type ExportDestination = 'GOOGLE_DRIVE' | 'EMAIL' | 'OBJECT_STORAGE' | 'WEBHOOK'
export type ExportExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'
export type ExportTrigger = 'MANUAL' | 'SCHEDULED' | 'RUN_NOW'

/**
 * Filters applied before an export runs — the same predicates the applications
 * list uses, except `archived: null`, which covers active *and* archived rows.
 */
export interface ExportFilters {
  status?: string[]
  search?: string | null
  organization?: string | null
  platform?: string | null
  applicationDateFrom?: string | null
  applicationDateTo?: string | null
  archived?: boolean | null
  interviewScheduled?: boolean | null
  toSendLater?: boolean | null
}

export interface ExportColumnOption {
  key: string
  header: string
}

export interface ExportRequest {
  format: ExportFormat
  filters?: ExportFilters
  columns?: string[]
}

export interface ExportSchedule {
  id: string
  name: string
  format: ExportFormat
  frequency: ExportFrequency
  /** Local time in the schedule's timezone, "HH:mm". */
  time: string
  dayOfWeek?: number | null
  dayOfMonth?: number | null
  timezone: string
  enabled: boolean
  destination: ExportDestination
  filters?: ExportFilters
  columns?: string[]
  /** UTC instants. */
  nextRunAt?: string | null
  lastRunAt?: string | null
  running: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ExportScheduleRequest {
  name: string
  format: ExportFormat
  frequency: ExportFrequency
  time: string
  dayOfWeek?: number | null
  dayOfMonth?: number | null
  timezone?: string
  enabled?: boolean
  filters?: ExportFilters
  columns?: string[]
  destination: ExportDestination
}

export interface ExportExecution {
  id: string
  scheduleId?: string | null
  scheduleName?: string | null
  trigger: ExportTrigger
  format: ExportFormat
  destination?: ExportDestination | null
  status: ExportExecutionStatus
  startedAt: string
  finishedAt?: string | null
  recordCount?: number | null
  truncated: boolean
  fileName?: string | null
  fileUrl?: string | null
  errorMessage?: string | null
}

export interface ExportExecutionPage {
  executions: ExportExecution[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
}
