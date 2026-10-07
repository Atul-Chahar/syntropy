import type { NextConfig } from 'next'

// The app ships inside the Android WebView, so it is a fully static export:
// no server rendering, route handlers, middleware or image optimisation.
// Routes that need an id take it from the query string (/meal/review?id=…).
const config: NextConfig = {
  output: 'export',
  // GitHub Pages hosts the web demo under /syntropy/demo (set in .github/workflows/pages.yml).
  basePath: process.env.NEXT_BASE_PATH || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // Next 16 dev writes AGENTS.md/CLAUDE.md here otherwise; the repo has its own at the root.
  agentRules: false,
  transpilePackages: ['@syntropy/core', '@syntropy/ai', '@syntropy/ui'],
}

export default config
