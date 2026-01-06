/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Uncomment and set basePath if deploying to github.io/repo-name
  // basePath: '/mtg_app',
  // assetPrefix: '/mtg_app/',
};

module.exports = nextConfig;
