/** @type {import('tailwindcss').Config} */
const rgb = (v) => `rgb(var(${v}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: rgb('--c-forest'),
        moss: rgb('--c-moss'),
        leaf: rgb('--c-leaf'),
        sky: rgb('--c-sky'),
        cream: rgb('--c-cream'),
        card: rgb('--c-card'),
        ink: rgb('--c-ink'),
        muted: rgb('--c-muted'),
        warn: rgb('--c-warn'),
        accent: { DEFAULT: rgb('--c-accent'), foreground: 'rgb(255 255 255 / <alpha-value>)' },
        // shadcn/ui semantic tokens mapped onto the eco palette
        background: rgb('--c-cream'),
        foreground: rgb('--c-ink'),
        primary: { DEFAULT: rgb('--c-forest'), foreground: rgb('--c-cream') },
        secondary: { DEFAULT: rgb('--c-leaf'), foreground: rgb('--c-forest') },
        destructive: { DEFAULT: rgb('--c-warn'), foreground: 'rgb(255 255 255 / <alpha-value>)' },
        'card-foreground': rgb('--c-ink'),
        'muted-foreground': rgb('--c-muted'),
        input: rgb('--c-leaf'),
        ring: rgb('--c-sky'),
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: { chip: '8px', card: '16px', hero: '24px' },
      boxShadow: {
        soft: '0 4px 16px rgb(var(--c-forest) / 0.08)',
        lift: '0 10px 30px rgb(var(--c-forest) / 0.16)',
        bloom: '0 0 0 6px rgb(var(--c-accent) / 0.16)',
      },
      transitionTimingFunction: { standard: 'cubic-bezier(0.4, 0, 0.2, 1)' },
      keyframes: {
        floatUp: { '0%': { opacity: 1, transform: 'translateY(0) scale(1)' }, '100%': { opacity: 0, transform: 'translateY(-46px) scale(1.3)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 0 0 rgb(var(--c-accent) / 0.5)' }, '50%': { boxShadow: '0 0 0 14px rgb(var(--c-accent) / 0)' } },
      },
      animation: {
        floatUp: 'floatUp 900ms cubic-bezier(0.4,0,0.2,1) forwards',
        pulseGlow: 'pulseGlow 2s ease-out infinite',
      },
    },
  },
  plugins: [],
}
