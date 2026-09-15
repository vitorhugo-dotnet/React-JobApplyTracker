import type { ReactNode } from 'react'
import { BrandLogo } from '@/components/layout/BrandLogo'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mono-w px-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-7">
          <BrandLogo className="text-xl" />
        </div>

        <h1 className="text-[22px] font-bold tracking-[-0.02em]">{title}</h1>
        <p className="mb-6 mt-1 text-[13.5px] text-mono-9">{subtitle}</p>

        {children}

        <div className="mt-6 border-t border-mono-e5 pt-5 text-center text-[13px] text-mono-9">
          {footer}
        </div>
      </div>
    </div>
  )
}

export function authErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response
    if (resp?.data?.message) return resp.data.message
  }
  return fallback
}
