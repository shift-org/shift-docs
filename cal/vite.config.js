import path from "path"
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // needed to use inline templates, otherwise vue errors out:
      // "[Vue warn]: Component provided template option but runtime compilation is not supported in this build of Vue. Configure your bundler to alias "vue" to "vue/dist/vue.esm-bundler.js"."
      // could maybe shift to using single file components (.vue)
      vue: 'vue/dist/vue.esm-bundler.js',
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
