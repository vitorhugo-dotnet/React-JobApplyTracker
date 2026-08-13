/** Join conditional class names. Lightweight `clsx` replacement. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Pull the friendliest message out of an axios/Error rejection. */
export function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'response' in error) {
    const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message
    if (msg) return msg
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/** Build a stable initials avatar string from a name. */
export function initials(name?: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'
}
