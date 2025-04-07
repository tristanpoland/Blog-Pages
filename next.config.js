/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Uncomment and update if not using custom domain
  // basePath: '/repo-name',
}

module.exports = nextConfig
