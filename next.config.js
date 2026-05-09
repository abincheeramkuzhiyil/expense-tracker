/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    // Cache the app shell (HTML pages) — network-first so updates propagate, fallback offline
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'expense-tracker-app-shell',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

// basePath and assetPrefix are only applied in production builds (npm run build).
// In development and test (npm run dev), the app is served at the root so that
// Playwright's baseURL of http://localhost:3000 works correctly.
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  output: 'export',
  basePath: isProd ? '/expense-tracker' : '',
  assetPrefix: isProd ? '/expense-tracker/' : '',
  images: {
    unoptimized: true,
  },
};

module.exports = withPWA(nextConfig);

  