/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'cat-pink': '#FFB7C5',
        'cat-lavender': '#C4A8D4',
        'cat-cream': '#FFF3E0',
        'dark-bg': '#1A1A2E',
        'dark-panel': '#16213E',
        'dark-card': '#0F3460',
        'accent-pink': '#E91E8C',
        'accent-purple': '#9C27B0'
      },
      fontFamily: {
        rounded: ['Nunito', 'M PLUS Rounded 1c', 'sans-serif']
      }
    }
  },
  plugins: []
};
