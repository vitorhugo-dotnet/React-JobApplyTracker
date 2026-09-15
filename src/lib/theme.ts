export type Theme = 'light' | 'dark'

export function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem('theme', theme)
  document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.setAttribute('href', `/favicon-${theme}.svg`)
}

export function toggleTheme(): Theme {
  const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  const next: Theme = current === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}
