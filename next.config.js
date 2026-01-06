/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Required for GitHub Pages deployment to github.io/repo-name
  basePath: '/mtg_project',
  assetPrefix: '/mtg_project/',
};

module.exports = nextConfig;
