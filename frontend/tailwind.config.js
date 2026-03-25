/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: 'var(--tg-theme-bg-color, #faf9f7)',
          text: 'var(--tg-theme-text-color, #1a1a1a)',
          hint: 'var(--tg-theme-hint-color, #8b8685)',
          link: 'var(--tg-theme-link-color, #b8677d)',
          button: 'var(--tg-theme-button-color, #c4899a)',
          'button-text': 'var(--tg-theme-button-text-color, #ffffff)',
          secondary: 'var(--tg-theme-secondary-bg-color, #ffffff)',
        }
      },
      fontFamily: {
        sans: ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
