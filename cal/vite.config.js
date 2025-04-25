import path from "path"
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// use env to determine if this is being built by netlify.
// https://docs.netlify.com/configure-builds/environment-variables/#build-metadata
const isNetlify = !!process.env.NETLIFY;

// the files in the extras directory are built by hugo.
// ( for example: json for the menus, etc. )
// 'npm dev' tells hugo to output to the bin/dist directory;
// while netlify always uses the site/public directory.
const localPath = "../bin/dist/";
const netlifyPath = "../site/public/";
const content = isNetlify? netlifyPath: localPath;

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 
  base: '/events',
  resolve: {
    alias: {
      // the extras are used by siteConfig.js
      "extras": path.resolve(__dirname, content, "extras" ),
      // this is how images are referenced in festivalHeader:
      "/images": path.resolve(__dirname, content, "images" ),
    },
  }
})
