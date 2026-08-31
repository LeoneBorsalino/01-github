import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        // Nunca cachear llamadas a la API: los datos de pedidos/stock/cierre
        // tienen que ser siempre de red (network-first estricto).
        urlPattern: /\/api\/.*$/i,
        handler: "NetworkOnly",
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/i,
        handler: "NetworkOnly",
      },
      {
        // Shell de la app: network-first con fallback a cache si no hay señal.
        urlPattern: /^https?:\/\/.*\/(?!api).*$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "app-shell",
          expiration: { maxEntries: 64, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
