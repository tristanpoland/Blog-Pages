/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Uncomment and update if not using custom domain
  basePath: process.env.NEXT_PUBLIC_CUSTOM_BASE_PATH
}

module.exports = nextConfig
