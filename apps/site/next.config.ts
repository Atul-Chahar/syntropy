import type { NextConfig } from 'next'

// Marketing site: statically generated so it can be hosted anywhere for free.
const config: NextConfig = {
  output: 'export',
  basePath: process.env.NEXT_BASE_PATH || undefined,
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: ['@syntropy/ui'],
}

export default config
