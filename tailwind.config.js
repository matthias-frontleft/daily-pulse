/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#faf8f3',
        ink: '#1a1820',
        'ink-soft': '#54505e',
        'ink-faint': '#8a8694',
        hairline: '#e9e5dc',
        positive: '#15803d',
        negative: '#c2410c',
        loss: '#b91c1c',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(26,24,32,0.04), 0 8px 24px -16px rgba(26,24,32,0.18)',
      },
    },
  },
  plugins: [],
}
