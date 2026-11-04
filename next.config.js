/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/bundles',
        destination: '/combos',
        permanent: true,
      },
      {
        source: '/bundle/:id',
        destination: '/combo/:id',
        permanent: true,
      },
    ];
  },
};
module.exports = nextConfig;
