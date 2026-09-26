import type { NextConfig } from 'next'

// Marketing site: statically generated so it can be hosted anywhere for free.
const config: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: ['@syntropy/ui'],
}

export default config
