/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@finsnap/shared'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Tesseract.js needs these as external to work in Node/Next.js API routes
      config.externals = [...(config.externals || []), 'tesseract.js'];
    }
    return config;
  },
}

module.exports = nextConfig
