/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['react-p5'],
  typescript: { ignoreBuildErrors: true },
  output: process.env.DEPLOY ? 'export' : undefined,
  basePath: process.env.DEPLOY ? '/MyKnowledge' : '',
  images: { unoptimized: true },
}

module.exports = nextConfig
