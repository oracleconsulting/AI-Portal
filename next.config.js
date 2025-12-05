/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  eslint: {
    // Disable ESLint during build - we'll run it separately
    ignoreDuringBuilds: true,
  },
  // Required for standalone mode
  experimental: {
    outputFileTracingRoot: undefined,
  },
}

module.exports = nextConfig

