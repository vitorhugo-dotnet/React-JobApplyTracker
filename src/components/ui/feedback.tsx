import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block h-4 w-4 animate-spin rounded-full border-2 border-mono-e5 border-t-mono-1',
        className,
      )}
    />
  )
}

export function CenteredSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-mono-9">
      <Spinner />
      <span className="font-mono text-[11px]">{label}</span>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded border border-mono-e5 px-6 py-[60px] text-center">
      <div className="ph h-[88px] w-[120px]">illustration</div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="max-w-[320px] text-[13.5px] text-mono-9">{description}</p>}
      {action}
    </div>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded border border-[#e0d4d4] bg-[#fcf7f7] px-4 py-3 text-[13px] text-danger dark:border-[#3a2020] dark:bg-[#1a1010]"
    >
      {message}
    </div>
  )
}

/** Transient confirmation for an action that already succeeded. */
export function SuccessNote({ message }: { message: string }) {
  return (
    <div
      role="status"
      className="rounded border border-mono-e5 bg-surface-subtle px-4 py-3 text-[13px] text-mono-1"
    >
      {message}
    </div>
  )
}
