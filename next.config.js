/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['react-p5'],
  output: 'export',
  basePath: '/MyKnowledge',
  images: { unoptimized: true },
}

module.exports = nextConfig
