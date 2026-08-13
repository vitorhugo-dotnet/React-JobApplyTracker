import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  sub?: ReactNode
  actions?: ReactNode
}

export function PageHeader({ title, sub, actions }: PageHeaderProps) {
  return (
    <div className="mb-[22px] flex items-start gap-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-bold leading-tight tracking-[-0.02em]">{title}</h1>
        {sub && <p className="mt-0.5 text-[13.5px] text-mono-9">{sub}</p>}
      </div>
      {actions && <div className="ml-auto flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}

/** Standard page shell: scroll padding + max width, matching `.page`. */
export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-page px-4 pb-[60px] pt-[26px] sm:px-[30px]">{children}</div>
}

interface SectionLabelProps {
  title: string
  more?: ReactNode
}

export function SectionLabel({ title, more }: SectionLabelProps) {
  return (
    <div className="my-[26px] mb-3.5 flex items-center gap-2.5">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="h-px flex-1 bg-mono-e5" />
      {more && <span className="text-[12.5px] text-mono-9">{more}</span>}
    </div>
  )
}
