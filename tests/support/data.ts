import type {
  Achievement,
  Application,
  DashboardSummary,
  GamificationProfile,
  User,
} from '../../src/types'

export const MOCK_USER: User = {
  id: 'user-1',
  name: 'Jordan Diaz',
  email: 'jordan@diaz.dev',
  reminderTime: '09:00',
  roles: ['USER'],
  canUseGoogleIntegration: true,
  privacyPolicyAccepted: true,
}

export const MOCK_PROFILE: GamificationProfile = {
  currentXp: 1360,
  level: 7,
  currentLevelXp: 360,
  nextLevelXp: 2000,
  xpToNextLevel: 640,
  progressPercentage: 68,
  rankTitle: 'Persistent Hunter',
  streakDays: 11,
}

export const MOCK_SUMMARY: DashboardSummary = {
  totalApplications: 36,
  waitingResponses: 12,
  interviewsScheduled: 3,
  interviewCount: 7,
  overdueFollowUps: 2,
  dmRemindersEnabled: 9,
  toSendLater: 4,
  rejectedCount: 8,
  ghostingCount: 3,
  averageDailyApplications: 1.4,
  averageWeeklyApplications: 6.2,
  averageMonthlyApplications: 24.5,
}

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { code: 'first-contact', name: 'First Contact', description: 'Send your first application', unlocked: true, achievedAt: '2026-04-12' },
  { code: 'double-digits', name: 'Double Digits', description: 'Reach 10 applications sent', unlocked: true, achievedAt: '2026-04-28' },
  { code: 'in-the-room', name: 'In the Room', description: 'Land your first interview', unlocked: true, achievedAt: '2026-05-03' },
  { code: 'hot-streak', name: 'Hot Streak', description: '7-day application streak', unlocked: true, achievedAt: '2026-05-19' },
  { code: 'closer', name: 'Closer', description: 'Receive your first offer', unlocked: false, achievedAt: null },
  { code: 'half-century', name: 'Half Century', description: 'Send 50 applications', unlocked: false, achievedAt: null },
]

const day = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString()
}

export function seedApplications(): Application[] {
  return [
    mk('app-1', 'Senior Frontend Engineer', 'Linear', 'Priya Nayar', 'Technical Test', -7, 2, true),
    mk('app-2', 'Product Designer, Growth', 'Vercel', 'Marcus Webb', 'RH', -5, -6, false),
    mk('app-3', 'Full-stack Developer', 'Supabase', 'Dana Klein', 'Pending HR Response', -9, -1, true),
    mk('app-4', 'Design Engineer', 'Raycast', 'Tom Asante', 'Offer Negotiation', -21, 5, true),
    mk('app-5', 'Frontend Engineer II', 'Retool', 'Lena Ortiz', 'Rejected', -26, null, false),
    mk('app-6', 'UX Engineer', 'Notion', 'Sam Cho', 'RH', -3, 3, false),
    mk('app-7', 'Staff Product Designer', 'Stripe', 'Grace Liu', 'Technical Test', -13, 1, true),
    mk('app-8', 'Web Platform Engineer', 'Framer', 'Ivan Petrov', null, null, null, true),
    mk('app-9', 'Senior UI Engineer', 'Figma', 'Noor Hassan', 'Pending Hiring Manager Response', -4, 2, false),
    mk('app-10', 'Frontend Developer', 'Cron', 'Beth Owens', null, null, null, false),
    mk('app-11', 'Motion Designer', 'Rive', 'Carlos Mendez', 'RH', -8, -3, true),
    mk('app-12', 'Design Systems Lead', 'GitHub', 'Amy Tran', 'Ghosting', -35, null, false),
  ]

  function mk(
    id: string,
    vacancyName: string,
    organization: string,
    recruiterName: string,
    status: string | null,
    appliedOffset: number | null,
    nextOffset: number | null,
    note: boolean,
  ): Application {
    return {
      id,
      vacancyName,
      organization,
      recruiterName,
      vacancyLink: `https://jobs.example.com/${id}`,
      applicationDate: appliedOffset === null ? null : day(appliedOffset),
      nextStepDateTime: nextOffset === null ? null : day(nextOffset),
      status: status ?? null,
      toSendLater: status === null,
      // interviewScheduled is now an independent flag; app-1 is the seeded example.
      interviewScheduled: id === 'app-1',
      recruiterDmReminderEnabled: true,
      recruiterDmSentAt: null,
      note: note ? 'Follow up with the hiring manager about timeline.' : null,
      archived: false,
      createdAt: day(appliedOffset ?? -1),
      updatedAt: day(0),
    }
  }
}

export const ARCHIVED_APP: Application = {
  id: 'arch-1',
  vacancyName: 'Platform Engineer',
  organization: 'Render',
  recruiterName: 'Old Recruiter',
  status: 'Rejected',
  applicationDate: day(-90),
  nextStepDateTime: null,
  archived: true,
  recruiterDmReminderEnabled: false,
  note: null,
}
