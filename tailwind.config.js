/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Canvas background
        'canvas-bg': '#0A0F1B',
        'sidebar-bg': '#111827',
        
        // Cluster colors (20 distinct colors)
        'cluster': {
          '0': '#8B5CF6',
          '1': '#3B82F6',
          '2': '#10B981',
          '3': '#F59E0B',
          '4': '#EF4444',
          '5': '#EC4899',
          '6': '#14B8A6',
          '7': '#84CC16',
          '8': '#A855F7',
          '9': '#6366F1',
          '10': '#06B6D4',
          '11': '#EAB308',
          '12': '#F97316',
          '13': '#F43F5E',
          '14': '#22D3EE',
          '15': '#A3E635',
          '16': '#C084FC',
          '17': '#818CF8',
          '18': '#2DD4BF',
          '19': '#FACC15'
        }
      }
    },
  },
  plugins: [],
}