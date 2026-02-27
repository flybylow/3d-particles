/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['three'],
  async rewrites() {
    return [
      { source: '/ward/vocab', destination: '/ward/vocab.ttl' },
      { source: '/ward/profile', destination: '/ward/profile.ttl' },
    ]
  },
}

module.exports = nextConfig

