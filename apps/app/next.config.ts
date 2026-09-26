import type { NextConfig } from 'next'

// The app ships inside the Android WebView, so it is a fully static export:
// no server rendering, route handlers, middleware or image optimisation.
// Routes that need an id take it from the query string (/meal/review?id=…).
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  transpilePackages: ['@syntropy/core', '@syntropy/ai', '@syntropy/ui'],
}

export default config
