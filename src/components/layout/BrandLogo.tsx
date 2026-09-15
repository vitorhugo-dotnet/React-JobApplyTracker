import { cn } from '@/lib/utils'

interface BrandLogoProps {
  compact?: boolean
  className?: string
}

export function BrandLogo({ compact = false, className }: BrandLogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)} aria-label="Applywell">
      <img data-testid="brand-logo-light" src="/applywell-mark-dark.svg" alt="" className="h-7 w-[25px] shrink-0 object-contain dark:hidden" />
      <img data-testid="brand-logo-dark" src="/applywell-mark-light.svg" alt="" className="hidden h-7 w-[25px] shrink-0 object-contain dark:block" />
      {!compact && <span className="whitespace-nowrap text-[14.5px] font-semibold tracking-[-0.01em]">Applywell</span>}
    </div>
  )
}
