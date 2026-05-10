import type { NextConfig } from 'next';
import withPWA from '@ducanh2912/next-pwa';

const baseConfig: NextConfig = {
  reactStrictMode: false, // Leaflet breaks under React Strict Mode's double-mount in dev
  turbopack: {},           // Silence webpack-config warnings from plugins
  serverExternalPackages: ['@libsql/client', 'libsql'],
};

// Only apply PWA wrapper in production to avoid Turbopack conflicts in dev
const nextConfig =
  process.env.NODE_ENV === 'production'
    ? withPWA({
        dest: 'public',
        cacheOnFrontEndNav: true,
        aggressiveFrontEndNavCaching: true,
        reloadOnOnline: true,
      })(baseConfig)
    : baseConfig;

export default nextConfig;
