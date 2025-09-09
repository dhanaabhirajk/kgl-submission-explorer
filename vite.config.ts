import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Set base for GitHub Pages deployment (only in production build)
  base: mode === 'production' ? '/kgl-submission-explorer/' : '/',
}))
