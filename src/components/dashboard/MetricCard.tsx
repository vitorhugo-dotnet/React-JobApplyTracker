import type { ReactNode } from 'react'

export interface Metric {
  label: string
  value: ReactNode
  foot?: ReactNode
  /** spark fill 0–100 */
  spark?: number
}

export function MetricCard({ label, value, foot, spark }: Metric) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded border border-mono-e5 bg-mono-w p-3.5 hover:bg-surface-subtle">
      <div className="truncate font-mono text-[10px] uppercase tracking-wider text-mono-9">
        {label}
      </div>
      <div className="font-mono text-[26px] font-semibold leading-none tracking-[-0.02em]">
        {value}
      </div>
      {spark != null && (
        <div className="mt-0.5 h-[3px] overflow-hidden rounded-full bg-mono-e5">
          <div className="h-full bg-mono-1" style={{ width: `${Math.min(100, Math.max(0, spark))}%` }} />
        </div>
      )}
      {foot && <div className="flex items-center gap-1.5 text-[11.5px] text-mono-5">{foot}</div>}
    </div>
  )
}
