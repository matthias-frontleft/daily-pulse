import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from a GitHub Pages project path (matthias-frontleft.github.io/daily-pulse/).
// base is only applied for the production build; dev stays at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/daily-pulse/' : '/',
  plugins: [react()],
}))
