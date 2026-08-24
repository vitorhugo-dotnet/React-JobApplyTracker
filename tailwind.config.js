/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Monochrome design system driven by CSS custom properties so dark mode
        // is a single class toggle on <html> with no per-component dark: prefixes.
        mono: {
          0: 'var(--mono-0)',
          1: 'var(--mono-1)',
          2: 'var(--mono-2)',
          5: 'var(--mono-5)',
          9: 'var(--mono-9)',
          c: 'var(--mono-c)',
          e5: 'var(--mono-e5)',
          f5: 'var(--mono-f5)',
          w: 'var(--mono-w)',
        },
        danger: 'var(--danger)',
        surface: {
          subtle: 'var(--surface-subtle)',
          highlight: 'var(--surface-highlight)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', '"SF Mono"', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px',
      },
      fontSize: {
        eyebrow: ['10.5px', { lineHeight: '1.2', letterSpacing: '0.08em' }],
      },
      maxWidth: {
        page: '1280px',
        form: '680px',
        settings: '760px',
      },
    },
  },
  plugins: [],
}
