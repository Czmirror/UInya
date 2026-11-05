// Extends the Tailwind theme for the editor components.
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'editor-muted': '#775449',
        'editor-ink': '#43251A',
        'editor-line': '#DDC4A4',
        'editor-paper': '#FFFAEE',
        'editor-panel': '#FFF4DF',
        'editor-card': '#F7E6C7',
        'editor-stage': '#F4DEB8',
        'editor-focus': '#A54857',
        'cat-pink': '#F8AEB7',
        'cat-peach': '#F7D49C',
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
