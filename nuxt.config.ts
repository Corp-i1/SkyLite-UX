// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    "@nuxt/ui",
    "@nuxt/eslint",
  ],

  app: {
    layoutTransition: { name: "layout", mode: "out-in" },
    pageTransition: { name: "page", mode: "out-in" },
  },

  nitro: {
    moduleSideEffects: ["jsonwebtoken", "bcryptjs"],
    alias: {
      "#auth": "./server/utils",
    },
    experimental: {
      asyncContext: true,
    },
  },
  eslint: {
    config: {
      standalone: false, // <---
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  css: ["~/assets/css/main.css"],

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: "2024-11-27",
});
