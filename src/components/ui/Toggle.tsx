import { cn } from '@/lib/utils'
import { CheckIcon } from './icons'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
  'aria-label'?: string
}

export function Switch({ checked, onChange, id, 'aria-label': ariaLabel }: SwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors',
        checked ? 'bg-mono-0' : 'bg-mono-e5',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-mono-w shadow-sm transition-[left]',
          checked ? 'left-[18px]' : 'left-0.5',
        )}
      />
    </button>
  )
}

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
  'aria-label'?: string
}

export function Checkbox({ checked, onChange, id, 'aria-label': ariaLabel }: CheckboxProps) {
  return (
    <button
      type="button"
      id={id}
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'grid h-[18px] w-[18px] shrink-0 place-items-center rounded border transition-colors',
        checked ? 'border-mono-0 bg-mono-0 text-mono-w' : 'border-mono-c bg-mono-w text-transparent',
      )}
    >
      <CheckIcon />
    </button>
  )
}

interface ToggleRowProps {
  title: string
  sub?: string
  children: React.ReactNode
}

export function ToggleRow({ title, sub, children }: ToggleRowProps) {
  return (
    <div className="flex items-center gap-3 border-t border-mono-e5 py-3">
      <div className="flex-1">
        <div className="text-[13px] font-medium">{title}</div>
        {sub && <div className="text-[11.5px] text-mono-9">{sub}</div>}
      </div>
      {children}
    </div>
  )
}
