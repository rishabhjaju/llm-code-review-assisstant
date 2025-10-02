/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable new features if needed
    staleTimes: {
      dynamic: 30,
    },
  },
  webpack: (config, { isServer }) => {
    // Monaco editor webpack configuration
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  // Enable standalone output for deployment
  output: 'standalone',
}

module.exports = nextConfig
