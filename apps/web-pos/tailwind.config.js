/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Amber Twilight Palette ─────────────────────────────────────────
        // Primary  – Warm Amber     #E39A4B  (text must be Accent #3D2545)
        // Secondary – Rust Red      #B8543F  (text must be Neutral/White)
        // Accent    – Deep Purple   #3D2545  (text must be Neutral/White)
        // Neutral   – Warm Cream    #F8EBD9  (text must be Accent #3D2545)
        at: {
          primary:         '#E39A4B',  // Warm Amber  – highlights, badges
          secondary:       '#B8543F',  // Rust Red    – secondary actions, alerts
          accent:          '#3D2545',  // Deep Purple – navbars, dark cards, primary btn bg
          neutral:         '#F8EBD9',  // Warm Cream  – main bg, light surfaces
          // Tonal shades for hover / border / muted states
          'accent-light':  '#5a3868',  // lighter accent for borders / hover
          'accent-muted':  '#2a1a30',  // darker accent for deeper cards
          'primary-muted': '#f0b87a',  // lighter amber for hover
          'primary-dark':  '#c4832e',  // darker amber for pressed state
          'neutral-dark':  '#eddcbf',  // slightly darker cream for card bg
          'neutral-muted': '#d4c4a8',  // muted cream for disabled / placeholder
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
      pattern: /^(bg|text|border|ring|shadow|divide)-at-(primary|secondary|accent|neutral|accent-light|accent-muted|primary-muted|primary-dark|neutral-dark|neutral-muted)(\/\d+)?$/,
      variants: ['hover', 'focus', 'active'],
    },
  ],
  plugins: [],
}
