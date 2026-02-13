/** @type {import('next').NextConfig} */
const isDeploy = !!process.env.DEPLOY

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['react-p5'],
  typescript: { ignoreBuildErrors: true },
  output: isDeploy ? 'export' : undefined,
  basePath: isDeploy ? '/MyKnowledge' : '',
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: isDeploy ? '/MyKnowledge' : '',
  },
}

module.exports = nextConfig
