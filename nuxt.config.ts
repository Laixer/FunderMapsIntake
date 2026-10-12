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
        // The header's navy, so a phone's browser bar runs into it.
        { name: "theme-color", content: "#191e3c" },
        // What a shared link shows as its card. The same on every page: the
        // pages per pand and per melding are personal and say nothing here.
        { property: "og:site_name", content: "FunderMaps" },
        { property: "og:type", content: "website" },
        { property: "og:locale", content: "nl_NL" },
        { property: "og:title", content: "Funderingsinformatie doorgeven — FunderMaps" },
        {
          property: "og:description",
          content:
            "Geef door dat de funderingsinformatie van een pand niet klopt, of lever een " +
            "funderingsonderzoek of bewijs van herstel aan.",
        },
        { property: "og:image", content: "https://fundermaps.com/og-image.jpg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "685" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      // The mark the other FunderMaps apps show in the tab; public/favicon.ico
      // is the same mark for browsers that do not take an SVG icon.
      link: [{ rel: "icon", type: "image/svg+xml", href: "/fundermaps-mark.svg" }],
    },
  },
});
