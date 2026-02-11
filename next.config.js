/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['react-p5'],
  typescript: { ignoreBuildErrors: true },
  output: 'export',
  basePath: '/MyKnowledge',
  images: { unoptimized: true },
}

module.exports = nextConfig
