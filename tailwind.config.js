/** @type {import('tailwindcss').Config} */
// Tailwind is wired to the CSS variables declared in src/ui/theme.css so a
// single documented token set drives both dark (default) and light themes.
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'media', // respect prefers-color-scheme; dark is the design default
  theme: {
    extend: {
      colors: {
        // Surfaces & text resolve to CSS variables (see theme.css).
        bg: 'rgb(var(--mn-bg) / <alpha-value>)',
        surface: 'rgb(var(--mn-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--mn-surface-2) / <alpha-value>)',
        border: 'rgb(var(--mn-border) / <alpha-value>)',
        text: 'rgb(var(--mn-text) / <alpha-value>)',
        muted: 'rgb(var(--mn-muted) / <alpha-value>)',
        accent: 'rgb(var(--mn-accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--mn-accent-ink) / <alpha-value>)',
        danger: 'rgb(var(--mn-danger) / <alpha-value>)',
      },
      borderRadius: {
        lg: '8px',
        xl: 'var(--mn-radius)',
        '2xl': 'calc(var(--mn-radius) * 1.4)',
      },
      boxShadow: {
        panel: 'var(--mn-shadow)',
        'panel-sm': 'var(--mn-shadow-sm)',
      },
      fontFamily: {
        sans: ['var(--mn-font-sans)'],
        display: ['var(--mn-font-display)'],
      },
      transitionDuration: {
        DEFAULT: '170ms',
      },
      fontSize: {
        // Consistent type scale.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        xs: ['0.75rem', { lineHeight: '1.1rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.875rem', { lineHeight: '1.4rem' }],
        lg: ['1rem', { lineHeight: '1.5rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
      },
    },
  },
  plugins: [],
};
