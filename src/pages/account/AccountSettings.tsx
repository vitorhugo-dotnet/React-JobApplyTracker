import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Page, PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Switch } from '@/components/ui/Toggle'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { CenteredSpinner, ErrorNote, Spinner } from '@/components/ui/feedback'
import { useAsync } from '@/hooks/useAsync'
import { changePassword, updateProfile } from '@/api/auth'
import {
  getGoogleDriveStatus,
  getBaseResumes,
  createBaseResume,
  deleteBaseResume,
  getBaseInformation,
  createBaseInformation,
  deleteBaseInformation,
  updateRootFolder,
  startGoogleDriveOAuth,
  disconnectGoogleDrive,
  type GoogleDriveStatus,
} from '@/api/resumes'
import { getPasskeyStatus, registerPasskey, isPasskeySupported } from '@/api/passkey'
import { useAuthStore } from '@/store/authStore'
import type { BaseResume, BaseInformation } from '@/types'

function SetCard({
  title,
  sub,
  danger,
  children,
}: {
  title: string
  sub?: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`mb-4 rounded border ${
        danger
          ? 'border-[#e0d4d4] dark:border-[#3a2020]'
          : 'border-mono-e5'
      }`}
    >
      <div className="px-[18px] pb-3.5 pt-4">
        <div className="text-[14.5px] font-semibold">{title}</div>
        {sub && <div className="mt-0.5 text-[12.5px] text-mono-9">{sub}</div>}
      </div>
      <hr className="border-mono-e5" />
      <div className="p-[18px]">{children}</div>
    </div>
  )
}

function ProfileSection() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm({
    defaultValues: { name: user?.name ?? '', reminderTime: user?.reminderTime ?? '09:00' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    setSaved(false)
    try {
      const updated = await updateProfile({ name: values.name, reminderTime: values.reminderTime || undefined })
      setUser(updated)
      setSaved(true)
    } catch {
      setError('Could not save your profile.')
    }
  })

  return (
    <SetCard title="Profile" sub="How you appear across the app">
      <form onSubmit={onSubmit}>
        {error && (
          <div className="mb-4">
            <ErrorNote message={error} />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name">
            <Input id="name" {...register('name')} />
          </Field>
          <Field label="Email" htmlFor="email">
            <Input id="email" className="mono" value={user?.email ?? ''} readOnly disabled />
          </Field>
          <Field label="Preferred reminder time" htmlFor="reminderTime">
            <Input id="reminderTime" className="mono" type="time" {...register('reminderTime')} />
          </Field>
        </div>
        <div className="mt-[18px] flex items-center justify-end gap-3">
          {saved && <span className="font-mono text-[11px] text-mono-9">Saved ✓</span>}
          <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? <Spinner className="border-white/40 border-t-white" /> : 'Save profile'}
          </Button>
        </div>
      </form>
    </SetCard>
  )
}

function PasswordSection() {
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    setDone(false)
    try {
      await changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      setDone(true)
      reset()
    } catch {
      setError('Could not update your password.')
    }
  })

  return (
    <SetCard title="Change Password">
      <form onSubmit={onSubmit}>
        {error && (
          <div className="mb-4">
            <ErrorNote message={error} />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Current password" full htmlFor="currentPassword" error={errors.currentPassword?.message}>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...register('currentPassword', { required: 'Required' })}
            />
          </Field>
          <Field label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              {...register('newPassword', {
                required: 'Required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
            />
          </Field>
          <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...register('confirmPassword', {
                validate: (v) => v === watch('newPassword') || 'Passwords do not match',
              })}
            />
          </Field>
        </div>
        <div className="mt-[18px] flex items-center justify-end gap-3">
          {done && <span className="font-mono text-[11px] text-mono-9">Updated ✓</span>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : 'Update password'}
          </Button>
        </div>
      </form>
    </SetCard>
  )
}

function ResumeManager() {
  const { data: resumes, loading, reload } = useAsync<BaseResume[]>(
    () => getBaseResumes().catch(() => []),
    [],
  )
  const [docInput, setDocInput] = useState('')
  const [language, setLanguage] = useState('')
  const [isTemplate, setIsTemplate] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!docInput.trim()) return
    setAdding(true)
    setError(null)
    try {
      await createBaseResume({
        documentIdOrUrl: docInput.trim(),
        language: language.trim() || undefined,
        template: isTemplate,
      })
      setDocInput('')
      setLanguage('')
      setIsTemplate(false)
      reload()
    } catch {
      setError('Could not add resume. Make sure the Google Docs link or ID is valid.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    setError(null)
    try {
      await deleteBaseResume(id)
      reload()
    } catch {
      setError('Could not delete resume.')
    }
  }

  return (
    <div className="mt-5 border-t border-mono-e5 pt-5">
      <div className="mb-3 text-[13px] font-semibold">Resumes</div>

      {error && (
        <div className="mb-3">
          <ErrorNote message={error} />
        </div>
      )}

      {/* Add form */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className="field-input min-w-[220px] flex-1"
          placeholder="Google Docs link or document ID…"
          value={docInput}
          onChange={(e) => setDocInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <input
          className="field-input w-[88px] shrink-0"
          placeholder="Lang"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          aria-label="Language code (e.g. EN, PT)"
        />
        <div className="flex shrink-0 items-center gap-2">
          <Switch checked={isTemplate} onChange={setIsTemplate} aria-label="Mark as template" />
          <span className="select-none text-[12.5px] text-mono-5">Template</span>
        </div>
        <Button onClick={handleAdd} disabled={adding || !docInput.trim()} size="sm">
          {adding ? <Spinner /> : '+ Add'}
        </Button>
      </div>

      {/* Resume list */}
      {loading ? (
        <CenteredSpinner />
      ) : resumes && resumes.length > 0 ? (
        <div className="flex flex-col divide-y divide-mono-e5 overflow-hidden rounded border border-mono-e5">
          {resumes.map((r) => (
            <div key={r.id} className="flex min-w-0 items-center gap-3 px-3.5 py-2.5">
              <div className="min-w-0 flex-1 truncate text-[13px] text-mono-1">{r.name}</div>
              {r.language && (
                <span className="shrink-0 rounded border border-mono-e5 px-2 py-0.5 font-mono text-[11px] uppercase text-mono-9">
                  {r.language}
                </span>
              )}
              {r.template && (
                <span className="shrink-0 rounded border border-mono-e5 px-2 py-0.5 font-mono text-[11px] text-mono-9">
                  template
                </span>
              )}
              {r.readOnly && (
                <span className="shrink-0 rounded border border-mono-e5 px-2 py-0.5 font-mono text-[11px] text-mono-9">
                  read only
                </span>
              )}
              <Button size="sm" className="shrink-0 text-danger" onClick={() => handleDelete(r.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-3 text-center font-mono text-[11.5px] text-mono-9">
          No resumes added yet.
        </div>
      )}
    </div>
  )
}

function BaseInfoManager() {
  const { data: docs, loading, reload } = useAsync<BaseInformation[]>(
    () => getBaseInformation().catch(() => []),
    [],
  )
  const [docInput, setDocInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async () => {
    if (!docInput.trim()) return
    setAdding(true)
    setError(null)
    try {
      await createBaseInformation({ documentIdOrUrl: docInput.trim() })
      setDocInput('')
      reload()
    } catch {
      setError('Could not add document. Make sure the Drive link or ID is a Google Doc, PDF, DOCX, or Markdown file.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    setError(null)
    try {
      await deleteBaseInformation(id)
      reload()
    } catch {
      setError('Could not delete document.')
    }
  }

  return (
    <div className="mt-5 border-t border-mono-e5 pt-5">
      <div className="mb-1 text-[13px] font-semibold">Base information about me</div>
      <div className="mb-3 text-[12px] text-mono-9">
        Documents (Google Docs, PDF, DOCX, or Markdown) the AI reads first to learn about you.
      </div>

      {error && (
        <div className="mb-3">
          <ErrorNote message={error} />
        </div>
      )}

      {/* Add form */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className="field-input min-w-[220px] flex-1"
          placeholder="Drive link or file ID (Google Doc, PDF, DOCX, MD)…"
          value={docInput}
          onChange={(e) => setDocInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button onClick={handleAdd} disabled={adding || !docInput.trim()} size="sm">
          {adding ? <Spinner /> : '+ Add'}
        </Button>
      </div>

      {/* Document list */}
      {loading ? (
        <CenteredSpinner />
      ) : docs && docs.length > 0 ? (
        <div className="flex flex-col divide-y divide-mono-e5 overflow-hidden rounded border border-mono-e5">
          {docs.map((d) => (
            <div key={d.id} className="flex min-w-0 items-center gap-3 px-3.5 py-2.5">
              <div className="min-w-0 flex-1 truncate text-[13px] text-mono-1">{d.name}</div>
              {d.docType && (
                <span className="shrink-0 rounded border border-mono-e5 px-2 py-0.5 font-mono text-[11px] uppercase text-mono-9">
                  {d.docType}
                </span>
              )}
              <Button size="sm" className="shrink-0 text-danger" onClick={() => handleDelete(d.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-3 text-center font-mono text-[11.5px] text-mono-9">
          No base information added yet.
        </div>
      )}
    </div>
  )
}

function GoogleDriveSection() {
  const { data, loading, reload } = useAsync<GoogleDriveStatus>(
    () => getGoogleDriveStatus().catch(() => ({ connected: false })),
    [],
  )
  const connected = data?.connected
  const [folderInput, setFolderInput] = useState('')
  const [folderSaving, setFolderSaving] = useState(false)
  const [folderError, setFolderError] = useState<string | null>(null)
  const [folderSaved, setFolderSaved] = useState(false)
  const [conn, setConn] = useState(false)
  const [connError, setConnError] = useState<string | null>(null)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const handleConnect = async () => {
    setConn(true)
    setConnError(null)
    try {
      const { authorizationUrl } = await startGoogleDriveOAuth()
      window.location.href = authorizationUrl
    } catch {
      setConnError('Could not start the Google Drive connection.')
      setConn(false)
    }
  }

  const handleDisconnect = async () => {
    setConfirmDisconnect(false)
    setConn(true)
    setConnError(null)
    try {
      await disconnectGoogleDrive()
      reload()
    } catch {
      setConnError('Could not disconnect Google Drive.')
    } finally {
      setConn(false)
    }
  }

  const handleSaveFolder = async () => {
    if (!folderInput.trim()) return
    setFolderSaving(true)
    setFolderError(null)
    setFolderSaved(false)
    try {
      await updateRootFolder(folderInput.trim())
      setFolderInput('')
      setFolderSaved(true)
      reload()
    } catch {
      setFolderError('Could not update root folder. Check the folder ID or URL.')
    } finally {
      setFolderSaving(false)
    }
  }

  return (
    <SetCard title="Google Drive" sub="Store generated resumes in your Drive">
      {connError && (
        <div className="mb-4">
          <ErrorNote message={connError} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded border border-mono-e5 text-mono-5">▲</div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-medium">
            {loading ? 'Checking…' : connected ? `Connected as ${data?.email ?? 'your account'}` : 'Not connected'}
          </div>
          <div className="mono truncate text-xs text-mono-9">
            {connected
              ? `${data?.rootFolderName ?? 'Applywell'} · ${data?.fileCount ?? 0} files`
              : 'Connect to enable resume generation'}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-mono-e5 px-2.5 py-[3px] font-mono text-xs text-mono-2">
            <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-mono-1' : 'bg-mono-c'}`} />
            {connected ? 'Connected' : 'Offline'}
          </span>
          <Button
            size="sm"
            onClick={connected ? () => setConfirmDisconnect(true) : handleConnect}
            disabled={loading || conn}
          >
            {conn ? <Spinner /> : connected ? 'Disconnect' : 'Connect'}
          </Button>
        </div>
      </div>

      {connected && (
        <div className="mt-5 border-t border-mono-e5 pt-5">
          <div className="mb-3 text-[13px] font-semibold">Root Folder</div>
          {folderError && (
            <div className="mb-3">
              <ErrorNote message={folderError} />
            </div>
          )}
          <div className="mb-1 text-[12px] text-mono-9">
            Current:{' '}
            <span className="font-mono text-mono-5">{data?.rootFolderName ?? 'Default (Applywell)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="field-input min-w-0 flex-1"
              placeholder="Paste Drive folder ID or URL…"
              value={folderInput}
              onChange={(e) => { setFolderInput(e.target.value); setFolderSaved(false) }}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveFolder()}
            />
            <Button size="sm" className="shrink-0" onClick={handleSaveFolder} disabled={folderSaving || !folderInput.trim()}>
              {folderSaving ? <Spinner /> : 'Save'}
            </Button>
            {folderSaved && <span className="shrink-0 font-mono text-[11px] text-mono-9">Saved ✓</span>}
          </div>
        </div>
      )}

      {connected && <ResumeManager />}

      {connected && <BaseInfoManager />}

      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect Google Drive?"
        message="Resume generation will be disabled until you reconnect. Your registered base resumes are kept."
        confirmLabel="Disconnect"
        destructive
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmDisconnect(false)}
      />
    </SetCard>
  )
}

function PasskeySection() {
  const supported = isPasskeySupported()
  const { data, loading, reload } = useAsync<{ hasPasskeys: boolean }>(
    () => getPasskeyStatus().catch(() => ({ hasPasskeys: false })),
    [],
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasPasskeys = data?.hasPasskeys

  const onAdd = async () => {
    setError(null)
    setBusy(true)
    try {
      await registerPasskey()
      reload()
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
        return
      }
      const detail = err instanceof DOMException
        ? `${err.name}: ${err.message}`
        : err instanceof Error
          ? err.message
          : 'Unknown error'
      setError(`Could not register a passkey. ${detail}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SetCard title="Passkeys" sub="Sign in without a password">
      {error && (
        <div className="mb-4">
          <ErrorNote message={error} />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 py-2.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded border border-mono-e5 text-mono-5">⌘</div>
        <div className="min-w-0 flex-1 text-[13px] text-mono-9">
          {!supported
            ? 'This browser does not support passkeys.'
            : loading
              ? 'Checking…'
              : hasPasskeys
                ? 'A passkey is registered for your account.'
                : 'No passkeys registered yet.'}
        </div>
        <Button size="sm" className="shrink-0" onClick={onAdd} disabled={!supported || busy}>
          {busy ? <Spinner /> : '+ Add a passkey'}
        </Button>
      </div>
    </SetCard>
  )
}

export default function AccountSettings() {
  const logout = useAuthStore((s) => s.logout)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <Page>
      <PageHeader title="Account Settings" sub="Profile, security, and integrations" />
      <div className="max-w-settings">
        <ProfileSection />
        <PasswordSection />
        <PasskeySection />
        <GoogleDriveSection />

        <SetCard title="Danger Zone" sub="Irreversible and destructive actions" danger>
          <div className="flex flex-wrap items-center gap-3.5">
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium">Delete account</div>
              <div className="text-xs text-mono-9">
                Permanently remove your account, applications, and history.
              </div>
            </div>
            <Button
              onClick={() => setConfirmDelete(true)}
              className="shrink-0 border-[#d8c4c4] text-danger hover:bg-[#fcf7f7] dark:border-[#3a2020] dark:hover:bg-[#1a1010]"
            >
              Delete account
            </Button>
          </div>
        </SetCard>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete your account?"
        message="This will sign you out. Account deletion is processed by support — contact us to complete the request."
        confirmLabel="Sign out"
        destructive
        onConfirm={() => {
          setConfirmDelete(false)
          logout()
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </Page>
  )
}
