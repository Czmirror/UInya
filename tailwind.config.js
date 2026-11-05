// Extends the Tailwind theme for the editor components.
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'editor-muted': '#D8C5BB',
        'cat-pink': '#FFB7C5',
        'cat-peach': '#EAB999',
        'cat-cream': '#FFF3E0',
        'dark-bg': '#251A1C',
        'dark-panel': '#342427',
        'dark-card': '#483134',
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
