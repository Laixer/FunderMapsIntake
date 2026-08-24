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

  // Server-only unless nested under `public`. The intake app is the single
  // place in the estate that holds a Spaces credential on behalf of the public
  // internet, so nothing here is allowed to reach the browser.
  runtimeConfig: {
    s3Endpoint: "https://ams3.digitaloceanspaces.com",
    s3Region: "ams3",
    s3Bucket: "fundermaps",
    s3AccessKey: "",
    s3SecretKey: "",
    apiBase: "",
    intakeToken: "",

    // The geocoder is a public endpoint, so the browser may call it directly
    // when hydrating a deep link.
    public: {
      apiBase: "",
    },
  },
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
