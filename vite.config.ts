import { resolve } from "node:path"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

/** Fonts the first screen sets in, preloaded so text doesn't wait on the CSS. */
const PRELOAD_FONTS = /(KMR-Waldenburg-Buch|inter-latin-wght-normal)-.*\.woff2$/

function preloadFonts(): Plugin {
  return {
    name: "preload-fonts",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(_html, { bundle }) {
        return Object.keys(bundle ?? {})
          .filter((file) => PRELOAD_FONTS.test(file))
          .map((file) => ({
            tag: "link",
            attrs: {
              rel: "preload",
              href: `/${file}`,
              as: "font",
              type: "font/woff2",
              crossorigin: "",
            },
            injectTo: "head",
          }))
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadFonts()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
  },
})
