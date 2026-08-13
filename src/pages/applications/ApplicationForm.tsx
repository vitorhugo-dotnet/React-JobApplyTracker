import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { Page, PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Switch, Checkbox, ToggleRow } from '@/components/ui/Toggle'
import { Dialog } from '@/components/ui/Dialog'
import { CenteredSpinner, ErrorNote, Spinner } from '@/components/ui/feedback'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTime, toApiDate, toDateInputValue } from '@/lib/format'
import { type ApplicationRequest } from '@/types'
import {
  createApplication,
  getApplication,
  getStatuses,
  markDmSent,
  updateApplication,
} from '@/api/applications'
import { getBaseResumes } from '@/api/resumes'

interface FormValues {
  vacancyName: string
  recruiterName: string
  organization: string
  vacancyLink: string
  status: string
  applicationDate: string
  nextStepDate: string
  nextStepTime: string
  note: string
  baseResumeId: string
  toSendLater: boolean
  markDmSent: boolean
  interviewCount: number
}

const EMPTY: FormValues = {
  vacancyName: '',
  recruiterName: '',
  organization: '',
  vacancyLink: '',
  status: 'RH',
  applicationDate: '',
  nextStepDate: '',
  nextStepTime: '',
  note: '',
  baseResumeId: '',
  toSendLater: false,
  markDmSent: false,
  interviewCount: 0,
}

function buildRequest(
  values: FormValues,
  reminderEnabled: boolean,
  interviewScheduled: boolean,
  rhAcceptedConnection: boolean,
): ApplicationRequest {
  const nextStep = values.nextStepDate
    ? `${values.nextStepDate}T${values.nextStepTime || '09:00'}:00`
    : null
  return {
    vacancyName: values.vacancyName.trim(),
    recruiterName: values.recruiterName.trim() || undefined,
    organization: values.organization.trim() || undefined,
    vacancyLink: values.vacancyLink.trim() || undefined,
    status: values.toSendLater ? null : values.status,
    applicationDate: toApiDate(values.applicationDate),
    nextStepDateTime: nextStep,
    note: values.note.trim() || undefined,
    interviewScheduled,
    recruiterDmReminderEnabled: reminderEnabled,
    rhAcceptedConnection,
    interviewCount: values.interviewCount,
  }
}

export default function ApplicationForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [resumeDialog, setResumeDialog] = useState(false)

  // preserved fields not directly edited in the form
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [interviewScheduled, setInterviewScheduled] = useState(false)
  const [rhAcceptedConnection, setRhAcceptedConnection] = useState(false)
  const [alreadyDmSent, setAlreadyDmSent] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({ defaultValues: EMPTY })

  const existing = useAsync(
    async () => (isEdit && id ? getApplication(id) : null),
    [id],
    'Could not load this application.',
  )

  const resumes = useAsync(
    () => getBaseResumes().catch(() => []),
    [],
    'Could not load resumes.',
  )

  const statuses = useAsync(
    () => getStatuses(),
    [],
    'Could not load status options.',
  )

  // hydrate the form once the application loads
  useEffect(() => {
    const app = existing.data
    if (!app) return
    const next = app.nextStepDateTime ? new Date(app.nextStepDateTime) : null
    const pad = (n: number) => String(n).padStart(2, '0')
    reset({
      vacancyName: app.vacancyName ?? '',
      recruiterName: app.recruiterName ?? '',
      organization: app.organization ?? '',
      vacancyLink: app.vacancyLink ?? '',
      status: app.toSendLater ? (statuses.data?.[0] ?? 'RH') : (app.status ?? statuses.data?.[0] ?? 'RH'),
      applicationDate: app.toSendLater ? '' : toDateInputValue(app.applicationDate),
      nextStepDate: next ? `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}` : '',
      nextStepTime: next ? `${pad(next.getHours())}:${pad(next.getMinutes())}` : '',
      note: app.note ?? '',
      baseResumeId: '',
      toSendLater: app.toSendLater ?? !app.applicationDate,
      markDmSent: !!app.recruiterDmSentAt,
      interviewCount: app.interviewCount ?? 0,
    })
    setReminderEnabled(app.recruiterDmReminderEnabled ?? true)
    setInterviewScheduled(app.interviewScheduled ?? false)
    setRhAcceptedConnection(app.rhAcceptedConnection ?? false)
    setAlreadyDmSent(!!app.recruiterDmSentAt)
  }, [existing.data, reset])

  const toSendLater = watch('toSendLater')
  const markDm = watch('markDmSent')

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      const payload = buildRequest(values, reminderEnabled, interviewScheduled, rhAcceptedConnection)
      const saved = isEdit && id ? await updateApplication(id, payload) : await createApplication(payload)
      // Mark recruiter DM as sent if newly checked.
      if (values.markDmSent && !alreadyDmSent) {
        await markDmSent(saved.id)
      }
      navigate('/applications')
    } catch (error) {
      const msg =
        (typeof error === 'object' && error && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null) ?? 'Could not save the application.'
      setSubmitError(msg)
    }
  })

  if (isEdit && existing.loading) return <CenteredSpinner label="Loading application…" />
  if (isEdit && existing.error) {
    return (
      <Page>
        <ErrorNote message={existing.error} />
      </Page>
    )
  }

  return (
    <Page>
      <PageHeader
        title={isEdit ? 'Edit Application' : 'New Application'}
        sub="Track a vacancy you're applying to"
      />

      <form onSubmit={onSubmit} className="mx-auto max-w-form">
        {isDirty && (
          <div className="mb-5 flex items-center gap-2.5 rounded border border-mono-e5 border-l-[3px] border-l-mono-2 bg-[#fafaf7] px-3.5 py-2.5 text-[13px] text-mono-2">
            <span className="mono text-[11px]">●</span>
            You have unsaved changes.
          </div>
        )}

        {submitError && (
          <div className="mb-5">
            <ErrorNote message={submitError} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Vacancy Name" required full htmlFor="vacancyName" error={errors.vacancyName?.message}>
            <Input
              id="vacancyName"
              placeholder="Senior Frontend Engineer"
              aria-invalid={!!errors.vacancyName}
              {...register('vacancyName', { required: 'Vacancy name is required' })}
            />
          </Field>

          <Field label="Recruiter Name" htmlFor="recruiterName">
            <Input id="recruiterName" placeholder="e.g. Priya Nayar" {...register('recruiterName')} />
          </Field>
          <Field label="Organization" htmlFor="organization">
            <Input id="organization" placeholder="e.g. Linear" {...register('organization')} />
          </Field>

          <Field label="Vacancy Link" full hint="paste the job posting URL" htmlFor="vacancyLink">
            <Input id="vacancyLink" className="mono" placeholder="https://…" {...register('vacancyLink')} />
          </Field>

          <Field
            label="Status"
            htmlFor="status"
            error={statuses.error ?? undefined}
          >
            {statuses.loading ? (
              <div className="flex items-center gap-2 py-2 text-xs text-mono-9">
                <Spinner />
                Loading statuses…
              </div>
            ) : (
              <Select id="status" disabled={toSendLater} {...register('status')}>
                {(statuses.data ?? []).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Application Date" htmlFor="applicationDate">
            <Input
              id="applicationDate"
              type="date"
              disabled={toSendLater}
              {...register('applicationDate')}
            />
          </Field>

          <Field label="Next Step — Date" htmlFor="nextStepDate">
            <Input id="nextStepDate" type="date" {...register('nextStepDate')} />
          </Field>
          <Field label="Next Step — Time" htmlFor="nextStepTime">
            <Input id="nextStepTime" className="mono" type="time" {...register('nextStepTime')} />
          </Field>

          <Field label="Interviews" htmlFor="interviewCount" hint="how many interviews you've had">
            <Input
              id="interviewCount"
              type="number"
              min={0}
              {...register('interviewCount', { valueAsNumber: true, min: 0 })}
            />
          </Field>

          <Field label="Note" full htmlFor="note">
            <Textarea id="note" rows={3} placeholder="Context, contacts, things to remember…" {...register('note')} />
          </Field>

          <Field label="Base Resume" full htmlFor="baseResumeId">
            <Select id="baseResumeId" {...register('baseResumeId')}>
              <option value="">— Select a base resume —</option>
              {(resumes.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.language ? ` (${r.language})` : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {isEdit && (existing.data?.driveResumeDocumentUrl || existing.data?.driveResumeFileId) && (
          <div className="mt-5 rounded border border-mono-e5 border-l-[3px] border-l-mono-2 bg-[#fafaf7] px-3.5 py-3">
            <div className="mb-1 text-[11px] uppercase tracking-wide text-mono-9">Generated CV</div>
            <div className="text-[13px] text-mono-2">
              {existing.data?.driveResumeFileName ?? 'Generated resume'}
            </div>
            {existing.data?.driveResumeGeneratedAt && (
              <div className="mt-0.5 text-xs text-mono-9">
                Generated {formatDateTime(existing.data.driveResumeGeneratedAt)}
              </div>
            )}
            {existing.data?.driveResumeDocumentUrl && (
              <a
                href={existing.data.driveResumeDocumentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-[13px] text-mono-2 underline underline-offset-2 hover:text-mono-0"
              >
                Open in Google Docs ↗
              </a>
            )}
          </div>
        )}

        <div className="mt-5 border-t border-mono-e5">
          <ToggleRow title="Recruiter Accepted Connection" sub="The recruiter accepted my LinkedIn connection request">
            <Switch
              aria-label="Recruiter accepted connection"
              checked={rhAcceptedConnection}
              onChange={setRhAcceptedConnection}
            />
          </ToggleRow>
          <ToggleRow title="Interview Scheduled" sub="An interview has been booked">
            <Switch
              aria-label="Interview scheduled"
              checked={interviewScheduled}
              onChange={setInterviewScheduled}
            />
          </ToggleRow>
          <ToggleRow title="To Send Later" sub="Keep as a draft and remind me to send it">
            <Switch
              aria-label="To send later"
              checked={toSendLater}
              onChange={(v) => {
                setValue('toSendLater', v, { shouldDirty: true })
                if (v) {
                  setValue('applicationDate', '', { shouldDirty: true })
                  setValue('status', '', { shouldDirty: true })
                }
              }}
            />
          </ToggleRow>
          <ToggleRow title="Mark DM Sent" sub="I've already messaged the recruiter directly">
            <Checkbox
              aria-label="Mark DM sent"
              checked={markDm}
              onChange={(v) => setValue('markDmSent', v, { shouldDirty: true })}
            />
          </ToggleRow>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-mono-e5 pt-[18px]">
          <Button variant="ghost" onClick={() => navigate('/applications')}>
            Cancel
          </Button>
          <Button type="button" onClick={() => setResumeDialog(true)}>
            Create Resume
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="border-white/40 border-t-white" /> : 'Save'}
          </Button>
        </div>
      </form>

      <Dialog
        open={resumeDialog}
        onClose={() => setResumeDialog(false)}
        title="Generate a tailored resume"
        footer={
          <Button variant="primary" onClick={() => setResumeDialog(false)}>
            Got it
          </Button>
        }
      >
        Save this application first, then connect Google Drive under Account Settings to
        generate a tailored resume from your selected base resume.
      </Dialog>
    </Page>
  )
}
