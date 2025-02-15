import path from "path"
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 
  base: '/events',
  resolve: {
    alias: {
      // used by siteConfig.js
      // https://medium.com/@devxprite/how-to-setup-path-aliases-in-vite-df955939ffe8
      extras: path.resolve(__dirname, "../bin/dist/extras/"),
    },
  },
  build: {
    // FIX: temp for testing
    // really will need to integrate with netlify's build process.
    outDir: '../bin/dist/events'
  }
})
