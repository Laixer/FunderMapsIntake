import tailwindcss from "@tailwindcss/vite";

// Public terugmeldformulier.
//
// SSR is on for one reason worth the cost: /form/<bag-id> is a prefilled deep
// link handed out by partners, and resolving the address on the server saves a
// round trip on a phone. Everything else is a plain form.
export default defineNuxtConfig({
  compatibilityDate: "2026-08-24",
  devtools: { enabled: false },
  css: ["~/assets/css/main.css"],
  vite: { plugins: [tailwindcss()] },
  app: {
    head: {
      htmlAttrs: { lang: "nl" },
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#1f6feb" },
      ],
    },
  },
});
