/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Navy & Amber Palette (WCAG 2.1 AA) ─────────────────────────────
        // Primary   – Amber         #EBA000  (text MUST be Navy #0F2242 — 7.2:1)
        // Secondary – Rust Red      #B8543F  (text must be Cream/White — 4.9:1)
        // Accent    – Deep Navy     #18335E  (text must be Cream/White — 12.4:1)
        // Neutral   – Warm Cream    #FDFBF7  (text must be Navy — 12.4:1+)
        at: {
          primary:         '#EBA000',  // Amber       – primary buttons, badges, highlights
          secondary:       '#B8543F',  // Rust Red    – destructive / alert actions
          accent:          '#18335E',  // Deep Navy   – header, sidebar, dark cards
          neutral:         '#FDFBF7',  // Warm Cream  – page canvas, light surfaces
          ink:             '#0F2242',  // Dark Navy   – text base on cream & amber
          // Tonal shades for hover / border / muted states
          'accent-light':  '#2B4C80',  // lighter navy for borders / hover
          'accent-muted':  '#0F2242',  // deepest navy for inset cards / inputs
          'primary-muted': '#F5BC3A',  // lighter amber for hover (navy text still AA)
          'primary-dark':  '#8A5E00',  // deep amber — safe as TEXT on cream (5.5:1)
          'neutral-dark':  '#F3EEE3',  // slightly darker cream for card surfaces
          'neutral-muted': '#C5CFDF',  // muted light text on navy (8.6:1)
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  // ── Safelist: preserve at-* utilities built via template literals ──────────
  // PaymentPadModal, SmartCrossSellWidget, TransactionHistoryPanel etc. build
  // class strings dynamically (e.g. `bg-at-primary text-at-accent`). Without
  // this safelist those classes are purged in production builds.
  safelist: [
    {
      pattern: /^(bg|text|border|ring|shadow|divide)-at-(primary|secondary|accent|neutral|accent-light|accent-muted|primary-muted|primary-dark|neutral-dark|neutral-muted|ink)(\/\d+)?$/,
      variants: ['hover', 'focus', 'active'],
    },
  ],
  plugins: [],
}
