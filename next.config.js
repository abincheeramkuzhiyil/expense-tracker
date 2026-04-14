/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  reactStrictMode: true,
  turbopack: {},
  output: 'export',
  basePath: '/expense-tracker',
  assetPrefix: '/expense-tracker/',
  images: {
    unoptimized: true,
  },
};

module.exports = withPWA(nextConfig);
  