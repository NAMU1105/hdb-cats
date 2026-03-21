import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        singapore: {
          red: '#EF3340',
          white: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
